from datetime import datetime, timedelta, timezone

from conftest import future_expiry


def _create_market(contract, direct_vm, sender, expiry=None):
    direct_vm.sender = sender
    direct_vm.value = 1000
    return contract.create_market(
        "Will BTC exceed $100k?",
        "crypto",
        "bitcoin",
        "criteria",
        expiry if expiry is not None else future_expiry(),
    )


def test_place_trade_rejects_unknown_market(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    with direct_vm.expect_revert():
        contract.place_trade(999, "yes")


def test_place_trade_rejects_bad_position(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    with direct_vm.expect_revert():
        contract.place_trade(market_id, "maybe")


def test_place_trade_rejects_zero_value(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    with direct_vm.expect_revert():
        contract.place_trade(market_id, "yes")


def test_place_trade_rejects_after_expiry(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice, expiry=future_expiry(60))

    future = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    direct_vm.warp(future)

    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    with direct_vm.expect_revert():
        contract.place_trade(market_id, "yes")


def test_place_trade_accumulates_pool_and_records_trade(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/veri_market.py")
    market_id = _create_market(contract, direct_vm, direct_alice)

    direct_vm.sender = direct_alice
    direct_vm.value = 1000
    contract.place_trade(market_id, "yes")

    direct_vm.sender = direct_bob
    direct_vm.value = 500
    contract.place_trade(market_id, "no")

    market = contract.get_market(market_id)
    # _create_market posts a 1000-wei bond that seeds both pools 500/500 before any trade
    assert market["yes_pool"] == 1500
    assert market["no_pool"] == 1000

    trades = contract.get_market_trades(market_id)
    assert len(trades) == 2
    assert any(t["position"] == "yes" and t["amount"] == 1000 for t in trades)
    assert any(t["position"] == "no" and t["amount"] == 500 for t in trades)
