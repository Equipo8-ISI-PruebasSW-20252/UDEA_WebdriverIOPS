Feature: Pagos (Bill Pay)

  Background:
    Given I am on the login page
    When I login with john and demo
    Then I should see a text saying Accounts Overview

  # 4. Pagos (Billpay)
  Scenario: Registrar un pago exitoso a un beneficiario existente
    When I go to the Bill Pay page
    And I fill the bill pay form with:
      | payee            | Demo Telecom |
      | address          | Calle 123 #45 |
      | city             | Medellin |
      | state            | ANT |
      | zip              | 050021 |
      | phone            | 3001234567 |
      | account          | 54321 |
      | verifyAccount    | 54321 |
      | amount           | 25 |
      | fromAccountIndex | 0 |
    Then the bill pay review should show the entered data
    When I submit the bill payment
    Then I should see a bill payment success message

  Scenario: Mostrar error cuando las cuentas ingresadas no coinciden
    When I go to the Bill Pay page
    And I fill the bill pay form with:
      | payee            | Servicio Agua |
      | address          | Calle 50 #10 |
      | city             | Bogota |
      | state            | CUN |
      | zip              | 110911 |
      | phone            | 3109998888 |
      | account          | 98765 |
      | verifyAccount    | 12345 |
      | amount           | 15 |
      | fromAccountIndex | 0 |
    When I submit the bill payment
    Then I should see a bill payment error message containing account number

