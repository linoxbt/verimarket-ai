# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import typing

ERROR_EXPECTED = "[EXPECTED]"
ERROR_EXTERNAL = "[EXTERNAL]"
ERROR_TRANSIENT = "[TRANSIENT]"
ERROR_LLM = "[LLM_ERROR]"

CATEGORIES = ("crypto", "sports", "news", "weather")
DISPUTE_WINDOW_SECONDS = 24 * 60 * 60
CONFIDENCE_TOLERANCE = 15


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


@allow_storage
@dataclass
class Market:
    id: u256
    question: str
    category: str
    source_query: str
    resolution_criteria: str
    expiry: u256
    creator: Address
    status: str
    yes_pool: u256
    no_pool: u256
    pinned: bool
    hidden: bool


@allow_storage
@dataclass
class Resolution:
    market_id: u256
    outcome: str
    confidence: u256
    reasoning: str
    evidence_summary: str
    data_hash: str
    resolved_at: u256
    dispute_deadline: u256


@allow_storage
@dataclass
class Dispute:
    market_id: u256
    disputer: Address
    evidence: str
    bond_amount: u256
    filed_at: u256


@allow_storage
@dataclass
class Arbitration:
    market_id: u256
    outcome: str
    confidence: u256
    reasoning: str
    finalized_at: u256


@allow_storage
@dataclass
class Trade:
    market_id: u256
    trader: Address
    position: str
    amount: u256
    timestamp: u256


def _now() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def _build_evidence_url(category: str, source_query: str) -> str:
    if category == "crypto":
        return (
            "https://api.coingecko.com/api/v3/simple/price"
            f"?ids={source_query}&vs_currencies=usd&include_24hr_change=true"
        )
    if category == "sports":
        return f"https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e={source_query}"
    if category == "news":
        return (
            "https://api.gdeltproject.org/api/v2/doc/doc"
            f"?query={source_query}&mode=artlist&maxrecords=10&format=json"
        )
    if category == "weather":
        # source_query is "lat,lon" set by the market creator, e.g. "40.7128,-74.006"
        lat, lon = source_query.split(",")
        return (
            "https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            "&current=temperature_2m,precipitation,wind_speed_10m"
        )
    raise gl.vm.UserError(f"{ERROR_EXPECTED} Unknown category: {category}")


def _address_str(addr: Address) -> str:
    return addr.as_hex if hasattr(addr, "as_hex") else str(addr)


ADMIN_WALLETS = (
    "0xc759E906A02825D483714B8141758f6258145572",
    "0x747df176962E1495355562FE30b65F276f0B8404",
)


class VeriMarket(gl.Contract):
    owner: Address
    admins: DynArray[Address]
    next_id: u256
    markets: TreeMap[u256, Market]
    resolutions: TreeMap[u256, Resolution]
    disputes: TreeMap[u256, Dispute]
    arbitrations: TreeMap[u256, Arbitration]
    trades: DynArray[Trade]
    claimed_keys: DynArray[str]

    def __init__(self):
        self.owner = gl.message.sender_address
        self.next_id = u256(0)
        for wallet in ADMIN_WALLETS:
            self.admins.append(Address(wallet))

    # ------------------------------------------------------------------
    # Market lifecycle
    # ------------------------------------------------------------------

    @gl.public.write.payable
    def create_market(
        self,
        question: str,
        category: str,
        source_query: str,
        resolution_criteria: str,
        expiry: int,
    ) -> u256:
        if category not in CATEGORIES:
            raise gl.vm.UserError(
                f"{ERROR_EXPECTED} category must be one of {CATEGORIES}"
            )
        if int(expiry) <= _now():
            raise gl.vm.UserError(f"{ERROR_EXPECTED} expiry must be in the future")

        bond = gl.message.value
        if bond == u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Creating a market requires a bond")

        market_id = self.next_id
        self.next_id = u256(int(self.next_id) + 1)

        # The bond seeds both sides of the pool evenly -- it isn't returned to the
        # creator, it becomes initial liquidity that flows to whichever side's
        # traders end up winning, same as any other stake in the pool.
        half = int(bond) // 2
        yes_seed = u256(half)
        no_seed = u256(int(bond) - half)

        self.markets[market_id] = Market(
            id=market_id,
            question=question,
            category=category,
            source_query=source_query,
            resolution_criteria=resolution_criteria,
            expiry=u256(int(expiry)),
            creator=gl.message.sender_address,
            status="open",
            yes_pool=yes_seed,
            no_pool=no_seed,
            pinned=False,
            hidden=False,
        )
        return market_id

    @gl.public.write.payable
    def place_trade(self, market_id: u256, position: str) -> None:
        if market_id not in self.markets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Unknown market")
        if position not in ("yes", "no"):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} position must be 'yes' or 'no'")

        market = self.markets[market_id]
        if market.status != "open":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Market is not open for trading")
        if _now() >= int(market.expiry):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Market has expired")

        amount = gl.message.value
        if amount == u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Trade amount must be > 0")

        if position == "yes":
            market.yes_pool = u256(int(market.yes_pool) + int(amount))
        else:
            market.no_pool = u256(int(market.no_pool) + int(amount))

        self.trades.append(
            Trade(
                market_id=market_id,
                trader=gl.message.sender_address,
                position=position,
                amount=amount,
                timestamp=u256(_now()),
            )
        )

    # ------------------------------------------------------------------
    # AI resolution -- the actual GenLayer part
    # ------------------------------------------------------------------

    def _run_ai_decision(
        self, category: str, source_query: str, question: str, criteria: str, extra_context: str
    ) -> dict:
        url = _build_evidence_url(category, source_query)

        def leader_fn():
            response = gl.nondet.web.get(url)
            if response.status >= 500:
                raise gl.vm.UserError(f"{ERROR_TRANSIENT} evidence source unavailable ({response.status})")
            if response.status >= 400:
                raise gl.vm.UserError(f"{ERROR_EXTERNAL} evidence source returned {response.status}")

            if response.body is None:
                raise gl.vm.UserError(f"{ERROR_TRANSIENT} evidence source returned empty body")
            body = response.body.decode("utf-8", errors="replace")
            data_hash = hashlib.sha256(body.encode("utf-8")).hexdigest()
            evidence = body[:4000]

            prompt = f"""You are resolving a prediction market. Use ONLY the evidence below -- do not use outside knowledge.

Question: {question}
Resolution criteria: {criteria}
{extra_context}

Evidence (raw JSON from {url}):
{evidence}

Respond as JSON with exactly these keys:
{{"outcome": "yes" or "no", "confidence": integer 0-100, "reasoning": "short explanation citing the evidence"}}"""

            result = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(result, dict):
                raise gl.vm.UserError(f"{ERROR_LLM} non-dict LLM response")

            outcome = str(result.get("outcome", "")).strip().lower()
            if outcome not in ("yes", "no"):
                raise gl.vm.UserError(f"{ERROR_LLM} invalid outcome: {result.get('outcome')}")

            try:
                confidence = max(0, min(100, int(round(float(result.get("confidence", 0))))))
            except (ValueError, TypeError):
                raise gl.vm.UserError(f"{ERROR_LLM} invalid confidence: {result.get('confidence')}")

            reasoning = str(result.get("reasoning", ""))[:2000]

            return {
                "outcome": outcome,
                "confidence": confidence,
                "reasoning": reasoning,
                "evidence_summary": evidence[:500],
                "data_hash": data_hash,
            }

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                try:
                    leader_fn()
                    return False
                except gl.vm.UserError as e:
                    msg = str(e)
                    if msg.startswith(ERROR_EXPECTED) or msg.startswith(ERROR_EXTERNAL):
                        return True
                    if msg.startswith(ERROR_TRANSIENT):
                        return True
                    return False
                except Exception:
                    return False

            leader_data = leaders_res.calldata
            validator_data = leader_fn()

            if leader_data.get("outcome") != validator_data.get("outcome"):
                return False
            if abs(int(leader_data.get("confidence", 0)) - int(validator_data.get("confidence", 0))) > CONFIDENCE_TOLERANCE:
                return False
            return True

        return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

    @gl.public.write
    def resolve_market(self, market_id: u256) -> None:
        if market_id not in self.markets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Unknown market")

        market = self.markets[market_id]
        if market.status != "open":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Market is not open")
        if _now() < int(market.expiry):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Market has not expired yet")

        category = market.category
        source_query = market.source_query
        question = market.question
        criteria = market.resolution_criteria

        decision = self._run_ai_decision(category, source_query, question, criteria, extra_context="")

        now = _now()
        self.resolutions[market_id] = Resolution(
            market_id=market_id,
            outcome=decision["outcome"],
            confidence=u256(decision["confidence"]),
            reasoning=decision["reasoning"],
            evidence_summary=decision["evidence_summary"],
            data_hash=decision["data_hash"],
            resolved_at=u256(now),
            dispute_deadline=u256(now + DISPUTE_WINDOW_SECONDS),
        )
        market.status = "resolving"

    # ------------------------------------------------------------------
    # Disputes & arbitration
    # ------------------------------------------------------------------

    @gl.public.write.payable
    def file_dispute(self, market_id: u256, evidence: str) -> None:
        if market_id not in self.markets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Unknown market")
        market = self.markets[market_id]
        if market.status != "resolving":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Market is not awaiting dispute")

        resolution = self.resolutions[market_id]
        if _now() >= int(resolution.dispute_deadline):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Dispute window has closed")

        bond = gl.message.value
        if bond == u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Dispute requires a bond")

        self.disputes[market_id] = Dispute(
            market_id=market_id,
            disputer=gl.message.sender_address,
            evidence=evidence,
            bond_amount=bond,
            filed_at=u256(_now()),
        )
        market.status = "disputed"

    @gl.public.write
    def arbitrate(self, market_id: u256) -> None:
        if market_id not in self.markets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Unknown market")
        market = self.markets[market_id]
        if market.status != "disputed":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Market is not under dispute")

        resolution = self.resolutions[market_id]
        dispute = self.disputes[market_id]

        category = market.category
        source_query = market.source_query
        question = market.question
        criteria = market.resolution_criteria

        extra_context = f"""
This market was already resolved once with outcome "{resolution.outcome}" (confidence {int(resolution.confidence)}),
reasoning: {resolution.reasoning}

A dispute was then filed with this new evidence:
{dispute.evidence}

Weigh the original evidence AND the disputer's new evidence together and give a final, binding decision."""

        decision = self._run_ai_decision(category, source_query, question, criteria, extra_context)

        self.arbitrations[market_id] = Arbitration(
            market_id=market_id,
            outcome=decision["outcome"],
            confidence=u256(decision["confidence"]),
            reasoning=decision["reasoning"],
            finalized_at=u256(_now()),
        )
        market.status = "finalized"

        # Dispute bond: refunded to the disputer if arbitration overturns the original
        # resolution (the dispute was right), otherwise forfeited to the contract owner
        # as the cost of a failed dispute -- without this the bond had nowhere to go.
        if decision["outcome"] != resolution.outcome:
            _Recipient(dispute.disputer).emit_transfer(value=dispute.bond_amount)
        else:
            _Recipient(self.owner).emit_transfer(value=dispute.bond_amount)

    # ------------------------------------------------------------------
    # Payouts
    # ------------------------------------------------------------------

    @gl.public.write
    def claim_payout(self, market_id: u256) -> None:
        if market_id not in self.markets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Unknown market")
        market = self.markets[market_id]

        outcome: typing.Optional[str] = None
        if market.status == "finalized":
            outcome = self.arbitrations[market_id].outcome
        elif market.status == "resolving":
            resolution = self.resolutions[market_id]
            if _now() < int(resolution.dispute_deadline):
                raise gl.vm.UserError(f"{ERROR_EXPECTED} Dispute window still open")
            outcome = resolution.outcome
            market.status = "finalized"
        else:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Market is not finalized yet")

        sender = gl.message.sender_address
        claim_key = f"{int(market_id)}:{_address_str(sender)}"
        if claim_key in self.claimed_keys:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Already claimed")

        winning_stake = u256(0)
        for trade in self.trades:
            if int(trade.market_id) == int(market_id) and _address_str(trade.trader) == _address_str(sender) and trade.position == outcome:
                winning_stake = u256(int(winning_stake) + int(trade.amount))

        if winning_stake == u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} No winning stake to claim")

        total_winning_pool = int(market.yes_pool) if outcome == "yes" else int(market.no_pool)
        total_pool = int(market.yes_pool) + int(market.no_pool)
        if total_winning_pool == 0:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Winning pool is empty")

        payout = (int(winning_stake) * total_pool) // total_winning_pool

        self.claimed_keys.append(claim_key)

        if payout > 0:
            _Recipient(sender).emit_transfer(value=u256(payout))

    # ------------------------------------------------------------------
    # Admin
    # ------------------------------------------------------------------

    def _is_admin(self, sender: Address) -> bool:
        sender_str = _address_str(sender).lower()
        if sender_str == _address_str(self.owner).lower():
            return True
        return any(sender_str == _address_str(a).lower() for a in self.admins)

    @gl.public.write
    def add_admin(self, address: str) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only owner")
        self.admins.append(Address(address))

    @gl.public.write
    def remove_admin(self, address: str) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only owner")
        for i, a in enumerate(self.admins):
            if _address_str(a).lower() == address.lower():
                last = len(self.admins) - 1
                self.admins[i] = self.admins[last]
                self.admins.pop()
                return
        raise gl.vm.UserError(f"{ERROR_EXPECTED} Not an admin")

    @gl.public.write
    def pin_market(self, market_id: u256, pinned: bool) -> None:
        if not self._is_admin(gl.message.sender_address):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only admin")
        if market_id not in self.markets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Unknown market")
        self.markets[market_id].pinned = pinned

    @gl.public.write
    def hide_market(self, market_id: u256, hidden: bool) -> None:
        if not self._is_admin(gl.message.sender_address):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only admin")
        if market_id not in self.markets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Unknown market")
        self.markets[market_id].hidden = hidden

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    def _market_dict(self, m: Market) -> dict:
        return {
            "id": int(m.id),
            "question": m.question,
            "category": m.category,
            "source_query": m.source_query,
            "resolution_criteria": m.resolution_criteria,
            "expiry": int(m.expiry),
            "creator": _address_str(m.creator),
            "status": m.status,
            "yes_pool": int(m.yes_pool),
            "no_pool": int(m.no_pool),
            "pinned": m.pinned,
            "hidden": m.hidden,
        }

    def _resolution_dict(self, r: Resolution) -> dict:
        return {
            "market_id": int(r.market_id),
            "outcome": r.outcome,
            "confidence": int(r.confidence),
            "reasoning": r.reasoning,
            "evidence_summary": r.evidence_summary,
            "data_hash": r.data_hash,
            "resolved_at": int(r.resolved_at),
            "dispute_deadline": int(r.dispute_deadline),
        }

    def _dispute_dict(self, d: Dispute) -> dict:
        return {
            "market_id": int(d.market_id),
            "disputer": _address_str(d.disputer),
            "evidence": d.evidence,
            "bond_amount": int(d.bond_amount),
            "filed_at": int(d.filed_at),
        }

    def _arbitration_dict(self, a: Arbitration) -> dict:
        return {
            "market_id": int(a.market_id),
            "outcome": a.outcome,
            "confidence": int(a.confidence),
            "reasoning": a.reasoning,
            "finalized_at": int(a.finalized_at),
        }

    def _trade_dict(self, t: Trade) -> dict:
        return {
            "market_id": int(t.market_id),
            "trader": _address_str(t.trader),
            "position": t.position,
            "amount": int(t.amount),
            "timestamp": int(t.timestamp),
        }

    @gl.public.view
    def owner_address(self) -> str:
        return _address_str(self.owner)

    @gl.public.view
    def get_admins(self) -> list:
        return [_address_str(self.owner)] + [_address_str(a) for a in self.admins]

    @gl.public.view
    def get_market(self, market_id: u256) -> dict:
        if market_id not in self.markets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Unknown market")
        return self._market_dict(self.markets[market_id])

    @gl.public.view
    def get_all_markets(self) -> list:
        return [self._market_dict(m) for m in self.markets.values()]

    @gl.public.view
    def get_market_trades(self, market_id: u256) -> list:
        return [self._trade_dict(t) for t in self.trades if int(t.market_id) == int(market_id)]

    @gl.public.view
    def get_user_trades(self, address: str) -> list:
        return [self._trade_dict(t) for t in self.trades if _address_str(t.trader) == address]

    @gl.public.view
    def get_resolution(self, market_id: u256) -> dict:
        if market_id not in self.resolutions:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} No resolution yet")
        return self._resolution_dict(self.resolutions[market_id])

    @gl.public.view
    def get_dispute(self, market_id: u256) -> dict:
        if market_id not in self.disputes:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} No dispute filed")
        return self._dispute_dict(self.disputes[market_id])

    @gl.public.view
    def get_arbitration(self, market_id: u256) -> dict:
        if market_id not in self.arbitrations:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} No arbitration yet")
        return self._arbitration_dict(self.arbitrations[market_id])
