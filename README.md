# Ride Sharing Application

## Overview

This is a Ride Sharing Application designed to simulate a ride-hailing system using various design patterns, including **Singleton**, **Observer**, **Factory**, and **Encapsulation**. It supports features such as ride requests, driver assignment, payment processing, premium user management, and driver VIP status upgrades.

## Features

1. **Ride Requests & Assignment**:
    - Users can request rides.
    - Rides are assigned to available drivers and locations are selected randomly.

2. **Payment Processing**:
    - Users make payments using a payment service.
    - The app verifies payment details (card number, balance) and processes the payment.
    - Premium users get a 10% discount on their ride fare.

3. **Premium User Management**:
    - Users can earn points based on their ride distance.
    - After earning 50 points, users are upgraded to "Premium" status.
    - Premium users are eligible for discounts and prioritized ride requests.

4. **Driver Management**:
    - Drivers can be marked as "VIP" if they accumulate a rating of 4 or more.
    - VIP drivers only accept Premium users.

5. **Asynchronous Operations**:
    - The app processes multiple ride requests asynchronously using **Generators**.
    - Rides are processed in the background, and users and drivers are notified of the status of their rides.

6. **Observer Pattern**:
    - Event-based system for notifying about user status changes (e.g., points earned, upgraded to Premium).
    - Listeners are set up for premium events using the **EventEmitter** class.

7. **Error Handling**:
    - The app gracefully handles errors, such as invalid input or unavailable drivers and users.

## Key Classes

1. **EventEmitter** (Observer Pattern):
    - Manages event listeners and emits events when specific actions occur (e.g., user earns points, user upgraded to Premium).

2. **RideSharingApp** (Singleton Pattern):
    - The core class that manages the app, including users, drivers, rides, payment processing, and events.
    - Ensures only a single instance of the app exists.
    - The drivers are fetched from a mock API provided by https://jsonplaceholder.typicode.com/users. This endpoint returns a list of users, which are used as drivers(name and id is used).

3. **User**:
    - Represents a user in the system with attributes like `id`, `name`, `paymentDetails`, and `inRide` status.
    - Can earn points and get upgraded to a Premium user.

4. **PremiumUser**:
    - Extends `User` and represents a user with Premium status and an associated discount.

5. **Driver**:
    - Represents a driver with attributes like `id`, `name`, `profit`, and `isAvailable`.
    - Drivers can receive ratings, which can lead to a VIP status upgrade.

6. **VIPDriver**:
    - Extends `Driver` and represents a driver with VIP status.

7. **Ride**:
    - Represents a ride request with details like `id`, `pickUp`, `dropOff`, `fare`, `status`, `distance`, `user`, and `driver`.

8. **RideFactory** (Factory Pattern):
    - Used to generate ride requests dynamically based on input data.

9. **PaymentService**:
    - Validates and processes user payments for rides.

## How It Works

1. **Initialization**:
    - Users, drivers, and locations are initialized.
    - A new instance of `RideSharingApp` is created, which initializes the payment service, users, and locations.

2. **Starting the App**:
    - The app is started with a specific number of ride requests.
    - Rides are processed asynchronously with **Generators**.

3. **Ride Processing**:
    - Users can request rides from available locations.
    - A random driver is assigned to each ride based on availability.
    - Users make payments, and if successful, the ride is accepted by the driver.
    - The ride progresses and is completed after a set duration calculated by the distance.

4. **Premium Users & VIP Drivers**:
    - Users can earn points based on ride distance, which can lead to a Premium upgrade.
    - VIP drivers are assigned based on accumulated ratings and can only accept Premium users.


## General Log Messages

- **App Started Successfully**:
  - `"App started successfully!"`

- **User Requests a Ride**:
  - `"User [Name] has requested a ride from [PickUp Location] to [DropOff Location]!"`

- **Driver Accepts the Ride**:
  - `"Driver [Name] has accepted the ride from User [Name]!"`

- **Driver Denies the Ride**:
  - `"Driver [Name] has denied the ride from User [Name]!"`

- **User Pays for the Ride**:
  - `"User [Name] has paid for the ride!"`

- **Ride Completed**:
  - `"Driver [Name] has completed the ride for User [Name]!"`

- **Error Fetching Drivers**:
  - `"Error fetching drivers: [Error Message]"`

- **Error During App Start**:
  - `"Error starting the app: [Error Message]"`


## Premium User Related Messages

- **Points Earned**:
  - `"User [Name] has earned [Points] points."`

- **User Upgraded to Premium**:
  - `"Congratulations! User [Name] has been upgraded to a Premium User!"`


## Driver Related Messages

- **Driver Upgraded to VIP**:
  - `"Congratulations! Driver [Name] has been upgraded to a VIP Driver!"`

- **Driver Downgraded to Regular**:
  - `"Unfortunately, Driver [Name] has been downgraded to a Regular Driver!"`


## Ride Payment Related Messages

- **Payment Failed (Low Balance or Wrong Card Number)**:
  - `"User [Name] failed to pay!"`

- **VIP Driver Cannot Accept Ride from Non-Premium User**:
  - `"Driver [Name] is a VIP driver and cannot accept the ride from User [Name]! Ride denied!"`


## Error Log Messages

- **Invalid Input for Ride Number**:
  - `"Input should be number!"`

- **No Rides to Process**:
  - `"No rides to process!"`

- **Invalid Number of Rides**:
  - `"Invalid number of rides!"`

- **No More Users Available to Request a Ride**:
  - `"No more users available in order to request a drive!"`

- **No More Drivers Available to Accept a Ride**:
  - `"No more drivers available in order to accept a drive!"`

- **Users, Drivers, or Locations Not Initialized**:
  - `"Users, drivers, or locations are not properly initialized!"`
