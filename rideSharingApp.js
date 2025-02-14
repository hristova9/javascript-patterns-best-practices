// EventEmitter class - Observer Pattern
class EventEmitter {
    constructor() {
        this.listeners = {}
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach((callback) => callback(data))
        }
    }

}

// Singleton patten is applied to RideSharingApp class
class RideSharingApp {
    static #inst = null;
    constructor(paymentService, users, locations) {
        this.paymentService = paymentService; //paymnetService is injected (Dependency Injection)
        this.users = users;
        this.locations = locations;
        this._drivers = [];
        this.rides = [];
        this.eventEmitter = new EventEmitter();

        if (RideSharingApp.#inst) return RideSharingApp.#inst;
        RideSharingApp.#inst = this;

        this.setupListenersPremium();
    }

    get drivers() {
        return this._drivers;
    }

    set drivers(drivers) {
        return this._drivers = drivers;
    }

    // Asynchronous Operation - fetching drivers data from an API
    async fetchDrivers() {
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/users');

            if (!response.ok) {
                throw new Error(`Error! Response staus ${response.status}!`);
            }

            const driversData = await response.json();
            console.log(driversData);
            this.drivers = driversData.map(d =>
                new Driver(d.id, d.name, 0, true)
            );


            console.log("Fetched Drivers: ", this.drivers);

        } catch (error) {
            console.error("Error fetching drivers: ", error.messsage);
        }
    }

    // Setting up listeners for premium-related events - Observer pattern
    setupListenersPremium() {
        this.eventEmitter.on('pointsEarned', ({ name, points }) => {
            console.log(`${name} has earned ${points} points.`);
        });
        this.eventEmitter.on('premiumUser', ({ name }) => {
            console.log(`Congratulations! ${name} has been upgraded to a Premium User!`);
        });
        this.eventEmitter.on('VIPDriver', ({ name }) => {
            console.log(`Congratulations! ${name} has been upgraded to a VIP Driver!`);
        });
        this.eventEmitter.on('regularDriver', ({ name }) => {
            console.log(`Unfortunatelly, ${name} has been downgraded to a Regular Driver!`);
        });
    }

    // Starting the RideSharing app
    async startApp(numRides) {
        await this.fetchDrivers();
        await this.processMultipleRides(numRides);
    }

    //Generating rides based on available users, drivers, and locations (Generator)
    *generateRides(numRides) {
        for (let i = 0; i < numRides; i++) {
            // Error handling
            if (this.locations.length === 0 || this.users.length === 0 || this.drivers.length === 0) {
                throw new Error("Users, drivers, or locations are not properly initialized.");
            }

            const pickUp = this.randomIndexMethod(this.locations);
            const dropOff = this.randomIndexMethod(this.locations);
            const user = this.randomIndexMethod(this.users.filter(u => !u.inRide));
            const driver = this.randomIndexMethod(this.drivers.filter(d => d.isAvailable));

            const ride = RideFactory.rideRequest(pickUp, dropOff, user, driver);
            this.rides.push(ride);

            console.log(`${user.name} has requested a ride from ${pickUp} to ${dropOff}!`);

            yield new Promise(resolve => {
                setTimeout(() => {
                    resolve(ride);
                }, 2000);
            });
        }
    }

    // Processing multiple rides asynchronously
    async processMultipleRides(numRides) {
        const rideGenerator = this.generateRides(numRides);

        for await (let ride of rideGenerator) {
            const paymentSuccess = this.payment(ride);

            if (paymentSuccess) {
                const user = ride.user;
                const driver = ride.driver;

                driver.isAvailable = false;
                user.inRide = true;          
                ride.status = "active";      

                console.log(`${driver.name} has accepted the ride from ${user.name}`);

                user.addPoints(ride.distance, this.eventEmitter);
                this.rideCompleted(ride);
            } else {
                console.log(`${ride.user.name} failed to pay. Ride denied.`);
            }
        }
    }

    // Helper function to select a random index from an array
    randomIndexMethod(array) {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    //Payment logic (handles user payment and applies premium discount)
    payment(ride) {
        const user = ride.user;
        const driver = ride.driver;
        const fare = ride.fare;

        const isValidPayment = this.paymentService.validatePayment(user.paymentDetails, fare);
        
        if (isValidPayment) {
            this.paymentService.processPayment(user, fare, driver);
            console.log(`${user.name} has paid for the ride!`);
            return true;
        } else {
            console.log(`${user.name} failed to pay. Ride denied.`);
            return false;
        }
    }

    // Ride completion logic and timing
    rideCompleted(ride) {
        const user = ride.user;
        const driver = ride.driver;
        const duration = ride.distance * 100;
        const raiting = Math.floor(Math.random() * 5) + 1;

        setTimeout(() => {
            user.inRide = false;
            driver.isAvailable = true;
            ride.status = "completed";
            console.log(`${driver.name} has completed the ride for ${user.name}!`);
            driver.addRaiting(raiting, this.eventEmitter);
        }, duration)
    }
}

// Factory pattern for creating Rides dinamically
class RideFactory {
    static rideRequest(pickUp, dropOff, user, driver) {
        const distance = Math.floor(Math.random() * 100) + 1;
        const fare = distance * 2;
        const rideId = Math.floor(Math.random() * 1000000).toString().padStart(10, '0');
        const status = "requested";

        return new Ride(rideId, pickUp, dropOff, fare, status, distance, user, driver);
    }
}

class User {
    // Encapsulation
    #paymentDetails;
    constructor(id, name, paymentDetails, inRide, premiumPoints) {
        this.id = id;
        this.name = name;
        this.#paymentDetails = paymentDetails;
        this.inRide = inRide;
        this.premiumPoints = premiumPoints;
        this.isPremium = false;
    }

    get paymentDetails() {
        return this.#paymentDetails;
    }

    addPoints(points, eventEmitter) {

        this.premiumPoints += points;
        eventEmitter.emit("pointsEarned", { name: this.name, points })
        this.checkForUpgrade(eventEmitter);
    }

    checkForUpgrade(eventEmitter) {
        if (this.premiumPoints >= 50 && !this.isPremium) {
            this.upgradeToPremium(eventEmitter);
        }
    }

    upgradeToPremium(eventEmitter) {
        this.isPremium = true;
        eventEmitter.emit("premiumUser", { name: this.name })

    }
}

class PremiumUser extends User {
    constructor(id, name, paymentDetails, inRide, premiumPoints) {
        super(id, name, paymentDetails, inRide, premiumPoints)
        this.isPremium = true;
    }
    getDiscount() {
        return 0.1;
    }
}

class Driver {
    constructor(id, name, profit, isAvailable) {
        this.id = id;
        this.name = name;
        this.profit = profit;
        this.isAvailable = isAvailable;
        this.isVIP = false
        this.VIPRaiting = 0;
    }

    addRaiting(raiting, eventEmitter) {
        if (this.VIPRaiting === 0) {
            this.VIPRaiting = raiting;
        }
        this.VIPRaiting += this.VIPRaiting + raiting / 2;
        this.checkForUpgrade(eventEmitter);
    }

    checkForUpgrade(eventEmitter) {
        if (this.VIPRaiting >= 4 && !this.isVIP) {
            this.upgradetoVIP(eventEmitter);
        } else if (this.VIPRaiting < 4 && this.isVIP) {
            this.downgradeToRegular(eventEmitter);
        }
    }

    upgradetoVIP(eventEmitter) {
        this.isVIP = true;
        eventEmitter.emit("VIPDriver", { name: this.name });
    }

    downgradeToRegular(eventEmitter) {
        this.isVIP = false;
        eventEmitter.emit("regularDriver", { name: this.name });
    }
}

class VIPDriver extends Driver {
    constructor() {
        super(id, name, profit, isAvailable)
        this.isVIP = true;
    }
}

class Ride {
    constructor(id, pickUp, dropOff, fare, status, distance, user, driver) {
        this.id = id;
        this.pickUp = pickUp;
        this.dropOff = dropOff;
        this.fare = fare;
        this.status = status;
        this.distance = distance;
        this.user = user;
        this.driver = driver
    }
}

class PaymentService {
    validatePayment(paymentDetails, fare) {
        const regex = /^\d{16}$/g;
        if (regex.exec(paymentDetails.cardNumber)
            && paymentDetails.expirationDate > 20
            && paymentDetails.balance >= fare) {
            return true;
        }
        return false;
    }

    processPayment(user, fare, driver) {
        user.paymentDetails.balance -= fare;
        driver.profit += fare;
    }
}

const usersData = [
    {
        id: "u1",
        name: "Peter Peterson1",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 1000.00
        },
        inRide: false,
    },
    {
        id: "u2",
        name: "Peter Peterson2",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 1000
        },
        inRide: false,
    },
    {
        id: "u3",
        name: "Peter Peterson3",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 1000
        },
        inRide: false,
    },
    {
        id: "u4",
        name: "Peter Peterson4",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 1000
        },
        inRide: false,
    },
    {
        id: "u5",
        name: "Peter Peterson5",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 1000
        },
        inRide: false,
    },
    {
        id: "u6",
        name: "Peter Peterson6",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 50
        },
        inRide: false
    },
    {
        id: "u7",
        name: "Peter Peterson7",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 10
        },
        inRide: false,
    },
    {
        id: "u8",
        name: "Peter Peterson8",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 1000
        },
        inRide: false,
    },
    {
        id: "u9",
        name: "Peter Peterson9",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 500
        },
        inRide: false,
    },
    {
        id: "u10",
        name: "Peter Peterson10",
        paymentDetails: {
            cardNumber: 1234567890123456,
            expirationDate: 111,
            balance: 100
        },
        inRide: false,
    },
]

const users = usersData.map(user => new User(user.id, user.name, user.paymentDetails, user.inRide, false));

const locations = [
    "Location 1",
    "Location 2",
    "Location 3",
    "Location 4",
    "Location 5",
    "Location 6",
    "Location 7",
    "Location 8",
    "Location 9",
    "Location 10",
    "Location 11",
    "Location 12",
]

const paymentService = new PaymentService();
const newApp = new RideSharingApp(paymentService, users, locations);
console.log(newApp.startApp(5));





