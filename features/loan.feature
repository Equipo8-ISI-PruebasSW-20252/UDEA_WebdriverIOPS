Feature: Préstamos (Request Loan)

  Background:
    Given I am on the login page
    When I login with john and demo
    Then I should see a text saying Accounts Overview

  # 5. Préstamos (loan)
  Scenario: Solicitar un préstamo aprobado
    When I go to the Request Loan page
    And I request a loan of 200 with a down payment of 100 from account index 0
    Then the loan evaluation result should be displayed
    And I should see that the loan was approved

  Scenario: Solicitud rechazada con monto alto y poco respaldo
    When I go to the Request Loan page
    And I request a loan of 50000 with a down payment of 1 from account index 0
    Then the loan evaluation result should be displayed
    And I should see the loan denial reason

