Feature: Implement Directory Renaming Logic

  Scenario: Implement Directory Renaming Logic - Happy Path
    Given the system is ready
    When Create the core logic to safely rename -example directories back to original names
    Then the acceptance criteria are met

  Scenario: Implement Directory Renaming Logic - Error Handling
    Given the system is ready
    When an error occurs
    Then it should be handled gracefully
