from conftest import future_expiry, past_expiry


def _create(contract, direct_vm, sender, expiry=None, value=1000):
    direct_vm.sender = sender
    direct_vm.value = value
    return contract.create_market(
        "Will BTC exceed $100k?",
        "crypto",
        "bitcoin",
        "Resolves YES if CoinGecko price > 100000 USD",
        expiry if expiry is not None else future_expiry(),
    )


def test_create_market_increments_ids(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    id0 = _create(contract, direct_vm, direct_alice)
    id1 = _create(contract, direct_vm, direct_alice)
    assert id0 == 0
    assert id1 == 1


def test_create_market_rejects_zero_bond(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    with direct_vm.expect_revert():
        contract.create_market(
            "Will BTC exceed $100k?", "crypto", "bitcoin", "criteria", future_expiry()
        )


def test_create_market_seeds_pool_from_bond(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 1001
    market_id = contract.create_market(
        "Will BTC exceed $100k?", "crypto", "bitcoin", "criteria", future_expiry()
    )
    market = contract.get_market(market_id)
    assert market["yes_pool"] + market["no_pool"] == 1001
    assert market["yes_pool"] == 500
    assert market["no_pool"] == 501


def test_create_market_rejects_invalid_category(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert():
        contract.create_market(
            "Will it rain?", "astrology", "x", "criteria", future_expiry()
        )


def test_create_market_rejects_past_expiry(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/veri_market.py")
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert():
        contract.create_market(
            "Will BTC exceed $100k?", "crypto", "bitcoin", "criteria", past_expiry()
        )
