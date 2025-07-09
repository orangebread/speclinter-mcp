Feature: Create Directory Detection Logic

  Scenario: Create Directory Detection Logic - Happy Path
    Given the system is ready
    When Implement logic to detect when -example directories exist and need to be renamed back
    Then the acceptance criteria are met

  Scenario: Create Directory Detection Logic - Error Handling
    Given the system is ready
    When an error occurs
    Then it should be handled gracefully
