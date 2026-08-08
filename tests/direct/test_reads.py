from conftest import future_expiry


def test_get_all_markets_and_user_trades(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy("contracts/veri_market.py")

    direct_vm.sender = direct_alice
    m0 = contract.create_market("Q1", "crypto", "bitcoin", "criteria", future_expiry())
    m1 = contract.create_market("Q2", "sports", "Arsenal_vs_Chelsea", "criteria", future_expiry())

    direct_vm.value = 100
    contract.place_trade(m0, "yes")

    direct_vm.sender = direct_bob
    direct_vm.value = 200
    contract.place_trade(m1, "no")

    all_markets = contract.get_all_markets()
    assert len(all_markets) == 2
    assert {m["id"] for m in all_markets} == {m0, m1}

    m0_trades = contract.get_market_trades(m0)
    m1_trades = contract.get_market_trades(m1)
    assert len(m0_trades) == 1
    assert len(m1_trades) == 1

    alice_address = m0_trades[0]["trader"]
    bob_address = m1_trades[0]["trader"]
    assert alice_address != bob_address

    alice_trades = contract.get_user_trades(alice_address)
    bob_trades = contract.get_user_trades(bob_address)
    assert len(alice_trades) == 1
    assert len(bob_trades) == 1
    assert alice_trades[0]["market_id"] == m0
    assert bob_trades[0]["market_id"] == m1
