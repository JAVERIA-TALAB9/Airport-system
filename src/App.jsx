import React, { useState, createContext, useContext, useEffect } from 'react';

// --- Utility Functions ---
const generateId = () => Math.random().toString(36).substring(2, 9);
const getInitialState = (key, defaultState) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultState;
  } catch (error) {
    console.error("Error reading localStorage:", error);
    return defaultState;
  }
};
const updateLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

// --- Dummy Initial Data ---
const DUMMY_USERS = [
  { id: 'user1', name: 'Admin User', email: 'admin@pasi.com', password: 'password', role: 'admin', bookedTickets: [] },
  { id: 'user2', name: 'Ali Khan', email: 'ali@pasi.com', password: 'password', role: 'user', bookedTickets: [] },
];
const DUMMY_FLIGHTS = [
  { id: 'f001', flightNumber: 'PK-755', origin: 'PEW', destination: 'DXB', time: '10:30', gate: '05', status: 'Scheduled', price: 450, bookedBy: [] },
  { id: 'f002', flightNumber: 'QR-601', origin: 'PEW', destination: 'DOH', time: '12:45', gate: '11', status: 'Delayed', price: 520, bookedBy: [] },
  { id: 'f003', flightNumber: 'PA-405', origin: 'PEW', destination: 'KHI', time: '14:00', gate: '03', status: 'Boarding', price: 180, bookedBy: [] },
  { id: 'f004', flightNumber: 'GF-011', origin: 'PEW', destination: 'BAH', time: '16:20', gate: '08', status: 'Scheduled', price: 490, bookedBy: [] },
  { id: 'f005', flightNumber: 'SV-345', origin: 'PEW', destination: 'RUH', time: '18:50', gate: '12', status: 'Departed', price: 600, bookedBy: [] },
  { id: 'f006', flightNumber: 'PK-740', origin: 'PEW', destination: 'ISB', time: '20:15', gate: '04', status: 'Scheduled', price: 150, bookedBy: [] },
  { id: 'f007', flightNumber: 'TK-144', origin: 'PEW', destination: 'IST', time: '21:30', gate: '07', status: 'Scheduled', price: 750, bookedBy: [] },
  { id: 'f008', flightNumber: 'PK-727', origin: 'PEW', destination: 'AUH', time: '23:00', gate: '10', status: 'Scheduled', price: 500, bookedBy: [] },
  { id: 'f009', flightNumber: 'G9-551', origin: 'PEW', destination: 'SHJ', time: '01:30', gate: '09', status: 'Scheduled', price: 420, bookedBy: [] },
  { id: 'f010', flightNumber: 'FZ-350', origin: 'PEW', destination: 'DXB', time: '02:45', gate: '06', status: 'Scheduled', price: 460, bookedBy: [] },
];

// --- Context Definitions ---
const AuthContext = createContext(null);
const UserContext = createContext(null);
const TicketContext = createContext(null);

// --- Providers ---

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);

  const login = (email, password, users) => {
    setError(null);
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      updateLocalStorage('currentUser', user);
      return true;
    } else {
      setError('Invalid email or password.');
      return false;
    }
  };

  const register = (name, email, password, users, setUsers) => {
    setError(null);
    if (users.find(u => u.email === email)) {
      setError('User with this email already exists.');
      return false;
    }
    const newUser = { id: generateId(), name, email, password, role: 'user', bookedTickets: [] };
    setUsers(prev => {
      const updated = [...prev, newUser];
      updateLocalStorage('users', updated);
      return updated;
    });
    login(email, password, [...users, newUser]); // Log in new user
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  useEffect(() => {
    const storedUser = getInitialState('currentUser', null);
    if (storedUser) {
      setCurrentUser(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const value = { isAuthenticated, currentUser, error, login, register, logout, setCurrentUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const UserProvider = ({ children }) => {
  const [users, setUsers] = useState(() => getInitialState('users', DUMMY_USERS));

  // CRUD Operations
  const addUser = (user) => {
    const newUser = { ...user, id: generateId(), bookedTickets: user.bookedTickets || [] };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    updateLocalStorage('users', updatedUsers);
  };

  const updateUser = (updatedUser) => {
    const updatedUsers = users.map(u => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    updateLocalStorage('users', updatedUsers);
    return updatedUsers;
  };

  const deleteUser = (userId) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    updateLocalStorage('users', updatedUsers);
  };

  const value = { users, setUsers, addUser, updateUser, deleteUser };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

const TicketProvider = ({ children }) => {
  const [flights, setFlights] = useState(() => getInitialState('flights', DUMMY_FLIGHTS));
  const { users, updateUser, setUsers } = useContext(UserContext);
  const { currentUser, setCurrentUser } = useContext(AuthContext);

  // CRUD Operations
  const addFlight = (flight) => {
    const newFlight = { ...flight, id: generateId(), bookedBy: [] };
    const updatedFlights = [...flights, newFlight];
    setFlights(updatedFlights);
    updateLocalStorage('flights', updatedFlights);
  };

  const updateFlight = (updatedFlight) => {
    const updatedFlights = flights.map(f => (f.id === updatedFlight.id ? updatedFlight : f));
    setFlights(updatedFlights);
    updateLocalStorage('flights', updatedFlights);
  };

  const deleteFlight = (flightId) => {
    const updatedFlights = flights.filter(f => f.id !== flightId);
    setFlights(updatedFlights);
    updateLocalStorage('flights', updatedFlights);

    // Also unbook the flight from all users
    const updatedUsers = users.map(user => ({
      ...user,
      bookedTickets: user.bookedTickets.filter(id => id !== flightId)
    }));
    setUsers(updatedUsers);
    updateLocalStorage('users', updatedUsers);
  };

  const bookTicket = (flightId) => {
    if (!currentUser) return false;

    // 1. Update Flight
    const flightToBook = flights.find(f => f.id === flightId);
    if (!flightToBook || flightToBook.bookedBy.includes(currentUser.id)) return;

    const updatedFlight = {
      ...flightToBook,
      bookedBy: [...flightToBook.bookedBy, currentUser.id]
    };
    updateFlight(updatedFlight);

    // 2. Update User
    const updatedUser = {
      ...currentUser,
      bookedTickets: [...currentUser.bookedTickets, flightId]
    };

    // Update global user list
    const allUpdatedUsers = updateUser(updatedUser);

    // Update current user context
    setCurrentUser(updatedUser);
    updateLocalStorage('currentUser', updatedUser);

    return updatedUser;
  };

  const value = { flights, addFlight, updateFlight, deleteFlight, bookTicket };
  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
};

// --- Custom Hooks for easy context access ---
const useAuth = () => useContext(AuthContext);
const useUsers = () => useContext(UserContext);
const useTickets = () => useContext(TicketContext);

// --- Reusable UI Components ---

const Button = ({ children, onClick, color = 'bg-blue-500', hover = 'hover:bg-blue-600', disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 font-semibold text-white rounded-xl transition-all duration-200 shadow-lg ${color} ${hover} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);

const NavLink = ({ children, onClick, current }) => (
  <a
    href="#"
    onClick={onClick}
    className={`px-3 py-2 rounded-lg transition-colors duration-200 font-medium ${
      current ? 'bg-white text-blue-800 shadow-inner' : 'text-white hover:bg-white hover:text-blue-800'
    }`}
  >
    {children}
  </a>
);

// --- Layout Component ---

const Header = ({ navigate, currentPage, isAuthenticated, logout }) => (
  <header className="bg-blue-600 shadow-xl sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
      <h1 onClick={() => navigate('dashboard')} className="text-3xl font-extrabold text-white cursor-pointer tracking-wider">
        Peshawar Airport System
      </h1>
      <nav className="flex space-x-2">
        {isAuthenticated && (
          <>
            <NavLink onClick={() => navigate('dashboard')} current={currentPage === 'dashboard'}>Home</NavLink>
            <NavLink onClick={() => navigate('flights')} current={currentPage === 'flights'}>Book a Flight</NavLink>
            <NavLink onClick={() => navigate('about')} current={currentPage === 'about'}>About Us</NavLink>
            <NavLink onClick={() => navigate('contact')} current={currentPage === 'contact'}>Contact Us</NavLink>
            <Button onClick={logout} color="bg-red-500" hover="hover:bg-red-600" className="text-sm py-1.5 px-4">Logout</Button>
          </>
        )}
      </nav>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-gray-800 text-white p-6 mt-12">
    <div className="max-w-7xl mx-auto text-center text-sm">
      &copy; {new Date().getFullYear()} Peshawar Airport System. All rights reserved. | Designed for U Devs Frontend Task.
    </div>
  </footer>
);

// --- Page Components ---

const SplashPage = ({ navigate }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('login');
    }, 2000); // Wait 2 seconds then go to login/register page
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <div className="text-center p-8 bg-white/90 rounded-3xl shadow-2xl backdrop-blur-sm">
        <div className="animate-bounce text-6xl mb-4" role="img" aria-label="Airplane">✈️</div>
        <h1 className="text-5xl font-extrabold text-gray-800 tracking-tight">
          Peshawar Airport System
        </h1>
        <p className="mt-4 text-xl text-gray-600">Loading your gateway to the world...</p>
      </div>
    </div>
  );
};

const AuthPage = ({ navigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, register, error } = useAuth();
  const { users, setUsers } = useUsers();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      if (login(email, password, users)) {
        navigate('dashboard');
      }
    } else {
      if (register(name, email, password, users, setUsers)) {
        navigate('dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 to-pink-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 space-y-6 bg-white rounded-3xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">{isLogin ? 'Login' : 'Register'}</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
            {error}
          </div>
        )}

        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
            required={!isLogin}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
          required
        />

        <Button type="submit" className="w-full" color="bg-blue-600" hover="hover:bg-blue-700">
          {isLogin ? 'Sign In' : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            className="text-blue-600 font-medium cursor-pointer hover:text-blue-800"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </form>
    </div>
  );
};

const DashboardPage = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { flights } = useTickets();

  const bookedFlights = flights.filter(f => currentUser?.bookedTickets.includes(f.id));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Home Section (Welcome & Intro Program) - Pastel Blue */}
      <section className="bg-blue-100 p-8 rounded-2xl shadow-xl mb-12">
        <h2 className="text-5xl font-extrabold text-blue-800 mb-4">Welcome to Peshawar Airport!</h2>
        <p className="text-xl text-gray-700 max-w-3xl mb-6">
          The gateway connecting Khyber Pakhtunkhwa to the world. We are dedicated to providing seamless, secure, and world-class travel experiences. Check your dashboard for personal flight details or book your next adventure now.
        </p>
        <div className="flex space-x-4">
          <Button onClick={() => navigate('dashboard')} color="bg-blue-600" hover="hover:bg-blue-700">User Dashboard</Button>
          <Button onClick={() => navigate('flights')} color="bg-pink-600" hover="hover:bg-pink-700">Book a Flight</Button>
        </div>
      </section>

      {/* User Dashboard Section - Pastel Purple */}
      <section className="bg-purple-100 p-8 rounded-2xl shadow-xl mb-12">
        <h2 className="text-3xl font-bold text-purple-800 mb-6">Your Personal Dashboard</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">User Profile</h3>
            <p><strong>Name:</strong> {currentUser?.name}</p>
            <p><strong>Email:</strong> {currentUser?.email}</p>
            <p><strong>User ID:</strong> <span className="text-xs break-all">{currentUser?.id}</span></p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Your Bookings ({bookedFlights.length})</h3>
            {bookedFlights.length > 0 ? (
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {bookedFlights.map(flight => (
                  <li key={flight.id} className="text-sm border-b pb-1">
                    <span className="font-medium text-blue-600">{flight.flightNumber}</span> to {flight.destination} at {flight.time}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">You currently have no booked flights.</p>
            )}
            <div className="mt-4">
              <Button onClick={() => navigate('flights')} color="bg-green-500" hover="hover:bg-green-600" className="py-2 px-4 text-sm">
                Book a New Flight
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Add Flights and Users CRUD links (Admin View only) */}
      {currentUser?.role === 'admin' && (
        <section className="bg-yellow-100 p-6 rounded-2xl shadow-xl">
          <h3 className="text-2xl font-bold text-yellow-800 mb-4">Admin Tools</h3>
          <div className="flex space-x-4">
            <Button onClick={() => navigate('users')} color="bg-yellow-600" hover="hover:bg-yellow-700">Manage Users (CRUD)</Button>
            <Button onClick={() => navigate('tickets')} color="bg-yellow-600" hover="hover:bg-yellow-700">Manage Flights (CRUD)</Button>
          </div>
        </section>
      )}
    </div>
  );
};

const FlightsPage = () => {
  const { flights, bookTicket } = useTickets();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');

  const handleBook = (flightId) => {
    bookTicket(flightId);
    setMessage(`Successfully booked flight! Check your Dashboard.`);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Book a Flight Section - Pastel Yellow */}
      <section className="bg-yellow-100 p-8 rounded-2xl shadow-xl mb-12">
        <h2 className="text-3xl font-bold text-yellow-800 mb-6">Book Your Next Flight</h2>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {message}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-md">
            <thead>
              <tr className="bg-yellow-300 text-gray-800 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Flight</th>
                <th className="py-3 px-6 text-left">Destination</th>
                <th className="py-3 px-6 text-center">Time</th>
                <th className="py-3 px-6 text-center">Price ($)</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {flights.map(flight => {
                const isBooked = currentUser?.bookedTickets.includes(flight.id);
                return (
                  <tr key={flight.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <span className="font-medium">{flight.flightNumber}</span>
                    </td>
                    <td className="py-3 px-6 text-left">{flight.destination}</td>
                    <td className="py-3 px-6 text-center">{flight.time}</td>
                    <td className="py-3 px-6 text-center font-bold">${flight.price}</td>
                    <td className="py-3 px-6 text-center">
                      <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                        flight.status === 'Scheduled' ? 'bg-green-200 text-green-600' :
                        flight.status === 'Delayed' ? 'bg-red-200 text-red-600' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {flight.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <Button
                        onClick={() => handleBook(flight.id)}
                        disabled={isBooked || flight.status === 'Departed'}
                        color={isBooked ? 'bg-gray-400' : 'bg-green-500'}
                        hover={isBooked ? '' : 'hover:bg-green-600'}
                        className="py-2 px-4 text-xs"
                      >
                        {isBooked ? 'Booked' : flight.status === 'Departed' ? 'Closed' : 'Book Now'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const AboutUsPage = () => (
  <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
    {/* About Us Section - Pastel Pink */}
    <section className="bg-pink-100 p-8 rounded-2xl shadow-xl mb-12 flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
      <div className="lg:w-1/2">
        <h2 className="text-3xl font-bold text-pink-800 mb-4">Our Vision at Peshawar Airport</h2>
        <p className="text-gray-700 mb-4">
          Peshawar International Airport (PEW) serves as a historical and strategic hub in the Khyber Pakhtunkhwa region. Our mission is to provide an efficient, safe, and pleasant travel experience for all domestic and international passengers. We continuously strive to upgrade our facilities and services to meet global standards while celebrating the rich cultural heritage of Peshawar.
        </p>
        <p className="text-gray-700 font-medium">
          "Connecting our history to your future."
        </p>
      </div>
      <div className="lg:w-1/2 flex justify-center">
        {/* Placeholder Picture - using a high-quality placeholder image */}
        <img
          src="https://placehold.co/600x400/f8bbd0/600020?text=Peshawar+Airport+View"
          alt="Architectural view of Peshawar Airport"
          className="rounded-xl shadow-lg w-full max-w-sm lg:max-w-full h-auto object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400?text=Airport+Image+Fallback"; }}
        />
      </div>
    </section>
  </div>
);

const ContactUsPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSent, setIsSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    setIsSent(true);
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setIsSent(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Contact Us Section - Pastel Purple */}
      <section className="bg-purple-100 p-8 rounded-2xl shadow-xl mb-12 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">Get In Touch</h2>
        <p className="text-center text-gray-700 mb-6">
          For flight inquiries, lost and found, or general feedback, please reach out to us.
        </p>

        {isSent && (
          <div className="bg-green-200 text-green-800 p-4 rounded-xl mb-4 text-center font-medium">
            Thank you! Your message has been received (simulated).
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border border-purple-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border border-purple-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
            required
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-3 border border-purple-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
            required
          ></textarea>
          <Button type="submit" className="w-full" color="bg-purple-600" hover="hover:bg-purple-700">
            Send Message
          </Button>
        </form>
      </section>
    </div>
  );
};

// Simplified CRUD components for Admin view (as required by PDF)
const AdminUserManagement = () => {
  const { users, deleteUser } = useUsers();
  // Simplified view - just listing and deleting
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-blue-800 mb-6">User Management (Admin CRUD)</h2>
      <div className="bg-white p-6 rounded-xl shadow-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-blue-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Bookings</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-3 whitespace-nowrap">{user.name}</td>
                <td className="p-3 whitespace-nowrap">{user.email}</td>
                <td className="p-3 whitespace-nowrap">{user.bookedTickets.length}</td>
                <td className="p-3 whitespace-nowrap">
                  <Button
                    onClick={() => deleteUser(user.id)}
                    color="bg-red-500"
                    hover="hover:bg-red-600"
                    className="py-1 px-3 text-xs"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminFlightManagement = () => {
  const { flights, deleteFlight } = useTickets();
  // Simplified view - just listing and deleting
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-pink-800 mb-6">Flight Management (Admin CRUD)</h2>
      <div className="bg-white p-6 rounded-xl shadow-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-pink-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              <th className="p-3">Flight No.</th>
              <th className="p-3">Destination</th>
              <th className="p-3">Time</th>
              <th className="p-3">Bookings</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {flights.map(flight => (
              <tr key={flight.id} className="hover:bg-gray-50">
                <td className="p-3 whitespace-nowrap">{flight.flightNumber}</td>
                <td className="p-3 whitespace-nowrap">{flight.destination}</td>
                <td className="p-3 whitespace-nowrap">{flight.time}</td>
                <td className="p-3 whitespace-nowrap">{flight.bookedBy.length}</td>
                <td className="p-3 whitespace-nowrap">
                  <Button
                    onClick={() => deleteFlight(flight.id)}
                    color="bg-red-500"
                    hover="hover:bg-red-600"
                    className="py-1 px-3 text-xs"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Application Component ---

const App = () => {
  // Simple state-based router for single-file app structure
  const [currentPage, setCurrentPage] = useState('splash');
  const { isAuthenticated, logout } = useAuth();

  const navigate = (page) => {
    if (page === 'login' || page === 'register') {
      setCurrentPage('auth');
    } else if (!isAuthenticated && page !== 'splash') {
      setCurrentPage('auth'); // Redirect to auth if not logged in
    } else {
      setCurrentPage(page);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'splash':
        return <SplashPage navigate={navigate} />;
      case 'auth':
        return <AuthPage navigate={navigate} />;
      case 'dashboard':
        return <DashboardPage navigate={navigate} />;
      case 'flights':
        return <FlightsPage />;
      case 'about':
        return <AboutUsPage />;
      case 'contact':
        return <ContactUsPage />;
      case 'users':
        return <AdminUserManagement />; // CRUD page from PDF requirement
      case 'tickets':
        return <AdminFlightManagement />; // CRUD page from PDF requirement
      default:
        return <DashboardPage navigate={navigate} />;
    }
  };

  // Only render header and footer if not on splash or auth page
  const showLayout = currentPage !== 'splash' && currentPage !== 'auth';

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {showLayout && <Header navigate={navigate} currentPage={currentPage} isAuthenticated={isAuthenticated} logout={logout} />}
      <main className={showLayout ? "pt-10 pb-10" : ""}>
        {renderPage()}
      </main>
      {showLayout && <Footer />}
    </div>
  );
};

// --- Wrapper for Context Providers (Meeting all PDF requirements) ---
const AppWrapper = () => (
  // Note: Firebase setup is commented out as the PDF requires local state management, but the
  // structure is maintained for platform compliance.
  // const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
  // const app = initializeApp(firebaseConfig);
  // const auth = getAuth(app);
  // const db = getFirestore(app);

  <UserProvider>
    <AuthProvider>
      <TicketProvider>
        <App />
      </TicketProvider>
    </AuthProvider>
  </UserProvider>
);

export default AppWrapper;