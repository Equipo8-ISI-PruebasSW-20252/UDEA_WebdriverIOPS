Feature: Transferencias

  # 3. Transferencias
  Scenario: Transferir fondos entre cuentas disponibles
    Given I am on the login page
    When I login with john and demo
    Then I should see a text saying Accounts Overview
    When I go to the Transfer Funds page
    And I note the balances for account index 0 and account index 1
    And I transfer 10 from account index 0 to account index 1
    Then the transfer should be successful

  Scenario: Validación de monto que excede saldo
    Given I am on the login page
    When I login with john and demo
    Then I should see a text saying Accounts Overview
    When I go to the Transfer Funds page
    And I attempt to transfer an amount greater than the available balance from account index 0 to account index 1
    Then I should see a validation error about insufficient funds
