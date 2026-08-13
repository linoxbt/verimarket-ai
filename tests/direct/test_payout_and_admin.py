import json
from datetime import datetime, timedelta, timezone

from conftest import future_expiry


def _create_market(contract, direct_vm, sender, expiry_seconds=30):
    direct_vm.sender = sender
    direct_vm.value = 1000
    return contract.create_market(
        "Will BTC exceed $100k?",
        "crypto",
        "bitcoin",
        "Resolves YES if price > 100000 USD",
        future_expiry(expiry_seconds),
    )


def _warp_past(direct_vm, hours=1):
    future = (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
    direct_vm.warp(future)


def _mock_evidence(direct_vm, outcome="yes", confidence=80):
    direct_vm.mock_web(
        r".*api\.coingecko\.com.*",
        {"status": 200, "body": json.dumps({"bitcoin": {"usd": 123456}})},
    )
    direct_vm.mock_llm(
        r".*",
        json.dumps({"outcome": outcome, "confidence": confidence, "reasoning": "because"}),
    )


def _resolve_past_dispute_window(contract, direct_vm, market_id, sender, outcome="yes"):
    _warp_past(direct_vm, hours=1)  # past market expiry
    _mock_evidence(direct_vm, outcome=outcome)
    direct_vm.sender = sender
    contract.resolve_market(market_id)
    _warp_past(direct_vm, hours=26)  # past the 24h dispute window


def test_claim_payout_rejects_unknown_market(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert():
        contract.claim_payout(999)


def test_claim_payout_rejects_before_finalized(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert():
        contract.claim_payout(market_id)


def test_claim_payout_pays_winner_and_blocks_double_claim(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)

    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    contract.place_trade(market_id, "yes")

    direct_vm.sender = direct_bob
    direct_vm.value = 500
    contract.place_trade(market_id, "no")

    _resolve_past_dispute_window(contract, direct_vm, market_id, direct_alice, outcome="yes")

    direct_vm.sender = direct_alice
    direct_vm.value = 0
    contract.claim_payout(market_id)

    market = contract.get_market(market_id)
    assert market["status"] == "finalized"

    with direct_vm.expect_revert():
        contract.claim_payout(market_id)


def test_claim_payout_rejects_losing_side(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)

    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    contract.place_trade(market_id, "yes")

    direct_vm.sender = direct_bob
    direct_vm.value = 500
    contract.place_trade(market_id, "no")

    _resolve_past_dispute_window(contract, direct_vm, market_id, direct_alice, outcome="yes")

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert():
        contract.claim_payout(market_id)


def test_pin_and_hide_market_owner_only(direct_vm, direct_deploy, direct_alice, direct_bob, direct_owner):
    # the deploying account becomes contract.owner — deploy as direct_owner explicitly
    direct_vm.sender = direct_owner
    direct_vm.value = 1000
    contract = direct_deploy("contracts/veri_market.py")
    market_id = contract.create_market(
        "Will BTC exceed $100k?", "crypto", "bitcoin", "criteria", future_expiry()
    )

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert():
        contract.pin_market(market_id, True)
    with direct_vm.expect_revert():
        contract.hide_market(market_id, True)

    direct_vm.sender = direct_owner
    contract.pin_market(market_id, True)
    contract.hide_market(market_id, True)

    market = contract.get_market(market_id)
    assert market["pinned"] is True
    assert market["hidden"] is True


def test_hardcoded_admin_wallets_can_pin_and_hide(direct_vm, direct_deploy, direct_owner):
    direct_vm.sender = direct_owner
    direct_vm.value = 1000
    contract = direct_deploy("contracts/veri_market.py")
    market_id = contract.create_market(
        "Will BTC exceed $100k?", "crypto", "bitcoin", "criteria", future_expiry()
    )

    admins = [a.lower() for a in contract.get_admins()]
    assert "0xc759e906a02825d483714b8141758f6258145572" in admins
    assert "0x747df176962e1495355562fe30b65f276f0b8404" in admins

    direct_vm.sender = "0xc759E906A02825D483714B8141758f6258145572"
    contract.pin_market(market_id, True)

    direct_vm.sender = "0x747df176962E1495355562FE30b65F276f0B8404"
    contract.hide_market(market_id, True)

    market = contract.get_market(market_id)
    assert market["pinned"] is True
    assert market["hidden"] is True


def test_add_and_remove_admin_owner_only(direct_vm, direct_deploy, direct_alice, direct_bob, direct_owner):
    direct_vm.sender = direct_owner
    contract = direct_deploy("contracts/veri_market.py")

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert():
        contract.add_admin("0x0000000000000000000000000000000000000001")

    direct_vm.sender = direct_owner
    contract.add_admin("0x0000000000000000000000000000000000000001")
    assert "0x0000000000000000000000000000000000000001" in contract.get_admins()

    contract.remove_admin("0x0000000000000000000000000000000000000001")
    assert "0x0000000000000000000000000000000000000001" not in contract.get_admins()

    with direct_vm.expect_revert():
        contract.remove_admin("0x0000000000000000000000000000000000000001")
