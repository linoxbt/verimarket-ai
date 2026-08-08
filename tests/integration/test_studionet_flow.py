"""Stateful, resumable Studionet smoke test, run one step at a time.

Studio's shared rate limit (30 req/min) only fits ~3 write transactions per
window, so this drives the flow step-by-step across separate `gltest -k <step>`
invocations spaced out with cooldowns, instead of one long pytest run that
redeploys from scratch and burns the whole budget on retries.

`get_accounts()` generates fresh random keys on every separate process
invocation for Studionet's auto-generated accounts, so identity would not
survive across steps run as separate `gltest` calls. Private keys are
generated once in the first step and persisted (alongside contract address
and market id) to /tmp/studionet_flow_state.json, then reconstructed with
`create_account(private_key)` in every later step.

Usage: gltest tests/integration/test_studionet_flow.py -k <step> -v -s -m slow --network studionet
Steps: deploy_and_create, trade_yes, trade_no, resolve, dispute, arbitrate, claim, status
"""
import json
import time
from pathlib import Path

import pytest
from genlayer_py import create_account
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

STATE_PATH = Path("/tmp/studionet_flow_state.json")


def _load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text())
    return {}


def _save_state(state: dict) -> None:
    STATE_PATH.write_text(json.dumps(state, indent=2))


def _get_contract(state: dict, account=None):
    factory = get_contract_factory("VeriMarket")
    return factory.build_contract(contract_address=state["contract_address"], account=account)


def _account(state: dict, name: str):
    return create_account(state["keys"][name])


@pytest.mark.slow
def test_deploy_and_create():
    keys = {
        name: create_account().key.hex()
        for name in ("creator", "yes_trader", "no_trader", "disputer")
    }
    creator = create_account(keys["creator"])

    factory = get_contract_factory("VeriMarket")
    contract = factory.deploy(account=creator, wait_interval=8000, wait_retries=15)
    print("deployed at", contract.address)

    expiry = int(time.time()) + 400
    tx = contract.create_market(
        args=[
            "Will BTC exceed $1?",
            "crypto",
            "bitcoin",
            "Resolves YES if CoinGecko USD price for bitcoin is greater than 1",
            expiry,
        ],
    ).transact(wait_interval=8000, wait_retries=15)
    assert tx_execution_succeeded(tx), tx
    print("create_market OK, expiry=", expiry)

    _save_state({
        "contract_address": str(contract.address),
        "market_id": 0,
        "expiry": expiry,
        "keys": keys,
    })


@pytest.mark.slow
def test_trade_yes():
    state = _load_state()
    yes_trader = _account(state, "yes_trader")
    contract = _get_contract(state)
    tx = contract.connect(yes_trader).place_trade(args=[state["market_id"], "yes"]).transact(
        value=1000, wait_interval=8000, wait_retries=15
    )
    assert tx_execution_succeeded(tx), tx
    print("yes trade OK, address:", yes_trader.address)


@pytest.mark.slow
def test_trade_no():
    state = _load_state()
    no_trader = _account(state, "no_trader")
    contract = _get_contract(state)
    tx = contract.connect(no_trader).place_trade(args=[state["market_id"], "no"]).transact(
        value=500, wait_interval=8000, wait_retries=15
    )
    assert tx_execution_succeeded(tx), tx
    print("no trade OK, address:", no_trader.address)


@pytest.mark.slow
def test_resolve():
    state = _load_state()
    creator = _account(state, "creator")
    contract = _get_contract(state, account=creator)

    now = int(time.time())
    if now < state["expiry"]:
        pytest.skip(f"not expired yet, {state['expiry'] - now}s remaining")

    tx = contract.resolve_market(args=[state["market_id"]]).transact(
        wait_interval=8000, wait_retries=20
    )
    assert tx_execution_succeeded(tx), tx
    print("resolve_market OK")

    resolution = contract.get_resolution(args=[state["market_id"]]).call()
    print("resolution:", resolution)
    assert resolution["outcome"] in ("yes", "no")
    assert 0 <= resolution["confidence"] <= 100
    assert len(resolution["data_hash"]) == 64


@pytest.mark.slow
def test_dispute():
    state = _load_state()
    disputer = _account(state, "disputer")
    contract = _get_contract(state)
    tx = contract.connect(disputer).file_dispute(
        args=[state["market_id"], "Stale price snapshot - please recheck."],
    ).transact(value=500, wait_interval=8000, wait_retries=15)
    assert tx_execution_succeeded(tx), tx
    print("file_dispute OK")

    market = contract.get_market(args=[state["market_id"]]).call()
    assert market["status"] == "disputed"


@pytest.mark.slow
def test_arbitrate():
    state = _load_state()
    creator = _account(state, "creator")
    contract = _get_contract(state, account=creator)
    tx = contract.arbitrate(args=[state["market_id"]]).transact(
        wait_interval=8000, wait_retries=20
    )
    assert tx_execution_succeeded(tx), tx
    print("arbitrate OK")

    arbitration = contract.get_arbitration(args=[state["market_id"]]).call()
    print("arbitration:", arbitration)
    assert arbitration["outcome"] in ("yes", "no")

    market = contract.get_market(args=[state["market_id"]]).call()
    assert market["status"] == "finalized"

    state["final_outcome"] = arbitration["outcome"]
    _save_state(state)


@pytest.mark.slow
def test_claim():
    state = _load_state()
    yes_trader = _account(state, "yes_trader")
    no_trader = _account(state, "no_trader")
    contract = _get_contract(state)
    winner = yes_trader if state["final_outcome"] == "yes" else no_trader

    tx = contract.connect(winner).claim_payout(args=[state["market_id"]]).transact(
        wait_interval=8000, wait_retries=15
    )
    assert tx_execution_succeeded(tx), tx
    print("claim_payout OK for winner", winner.address)

    tx2 = contract.connect(winner).claim_payout(args=[state["market_id"]]).transact(
        wait_interval=8000, wait_retries=15
    )
    assert not tx_execution_succeeded(tx2), "double-claim should have failed"
    print("double-claim correctly rejected")


@pytest.mark.slow
def test_status():
    state = _load_state()
    contract = _get_contract(state)
    print("market:", contract.get_market(args=[state["market_id"]]).call())
