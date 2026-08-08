import json
from datetime import datetime, timedelta, timezone

from conftest import future_expiry


def _create_market(contract, direct_vm, sender, expiry_seconds=30):
    direct_vm.sender = sender
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
        {"status": 200, "body": json.dumps({"bitcoin": {"usd": 123456, "usd_24h_change": 2.1}})},
    )
    direct_vm.mock_llm(
        r".*",
        json.dumps({"outcome": outcome, "confidence": confidence, "reasoning": "price exceeds threshold"}),
    )


def test_resolve_market_rejects_unknown_market(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert():
        contract.resolve_market(999)


def test_resolve_market_rejects_before_expiry(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice, expiry_seconds=3600)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert():
        contract.resolve_market(market_id)


def test_resolve_market_happy_path(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)
    _warp_past(direct_vm)
    _mock_evidence(direct_vm, outcome="yes", confidence=85)

    direct_vm.sender = direct_alice
    contract.resolve_market(market_id)

    market = contract.get_market(market_id)
    assert market["status"] == "resolving"

    resolution = contract.get_resolution(market_id)
    assert resolution["outcome"] == "yes"
    assert resolution["confidence"] == 85
    assert len(resolution["data_hash"]) > 0


def test_resolve_market_rejects_when_not_open(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)
    _warp_past(direct_vm)
    _mock_evidence(direct_vm)
    direct_vm.sender = direct_alice
    contract.resolve_market(market_id)

    with direct_vm.expect_revert():
        contract.resolve_market(market_id)


def test_file_dispute_rejects_unknown_market(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    with direct_vm.expect_revert():
        contract.file_dispute(999, "evidence")


def test_file_dispute_rejects_when_not_resolving(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    with direct_vm.expect_revert():
        contract.file_dispute(market_id, "evidence")


def test_file_dispute_rejects_zero_bond(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)
    _warp_past(direct_vm)
    _mock_evidence(direct_vm)
    direct_vm.sender = direct_alice
    contract.resolve_market(market_id)

    direct_vm.value = 0
    with direct_vm.expect_revert():
        contract.file_dispute(market_id, "evidence")


def test_file_dispute_and_arbitrate_flow(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)
    _warp_past(direct_vm)
    _mock_evidence(direct_vm, outcome="yes", confidence=70)
    direct_vm.sender = direct_alice
    contract.resolve_market(market_id)

    direct_vm.sender = direct_bob
    direct_vm.value = 2000
    contract.file_dispute(market_id, "the price dropped after the snapshot")

    market = contract.get_market(market_id)
    assert market["status"] == "disputed"

    dispute = contract.get_dispute(market_id)
    assert dispute["bond_amount"] == 2000

    direct_vm.clear_mocks()
    _mock_evidence(direct_vm, outcome="no", confidence=90)
    direct_vm.sender = direct_alice
    contract.arbitrate(market_id)

    market = contract.get_market(market_id)
    assert market["status"] == "finalized"

    arbitration = contract.get_arbitration(market_id)
    assert arbitration["outcome"] == "no"
    assert arbitration["confidence"] == 90


def test_arbitrate_rejects_when_not_disputed(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert():
        contract.arbitrate(market_id)
