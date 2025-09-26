-- Add more ports to cover all the port IDs referenced in your vessel data
INSERT INTO ports (id, name, country, city, port_type, lat, lng) VALUES 
(13, 'Tianjin', 'China', 'Tianjin', 'Commercial', 39.1422, 117.1767),
(14, 'Port Said', 'Egypt', 'Port Said', 'Commercial', 31.2565, 32.3020),
(15, 'Algeciras', 'Spain', 'Algeciras', 'Commercial', 36.1408, -5.4526),
(16, 'Le Havre', 'France', 'Le Havre', 'Commercial', 49.4944, 0.1079),
(17, 'Santos', 'Brazil', 'Santos', 'Commercial', -23.9537, -46.3329),
(35, 'Durban', 'South Africa', 'Durban', 'Commercial', -29.8587, 31.0218),
(44, 'Mumbai', 'India', 'Mumbai', 'Commercial', 19.0760, 72.8777),
(47, 'Jeddah', 'Saudi Arabia', 'Jeddah', 'Commercial', 21.4858, 39.1925),
(49, 'Karachi', 'Pakistan', 'Karachi', 'Commercial', 24.8607, 67.0011),
(51, 'Alexandria', 'Egypt', 'Alexandria', 'Commercial', 31.2001, 29.9187),
(68, 'Colombo', 'Sri Lanka', 'Colombo', 'Commercial', 6.9271, 79.8612),
(107, 'Port of Spain', 'Trinidad and Tobago', 'Port of Spain', 'Commercial', 10.6518, -61.5175),
(108, 'Vishakhapatnam', 'India', 'Vishakhapatnam', 'Commercial', 17.6868, 83.2185),
(119, 'Salalah', 'Oman', 'Salalah', 'Commercial', 17.0151, 54.0924),
(120, 'Khor Fakkan', 'UAE', 'Khor Fakkan', 'Commercial', 25.3426, 56.3379),
(123, 'Kandla', 'India', 'Kandla', 'Commercial', 23.0225, 70.2249),
(124, 'Cochin', 'India', 'Cochin', 'Commercial', 9.9312, 76.2673),
(132, 'Chennai', 'India', 'Chennai', 'Commercial', 13.0827, 80.2707),
(135, 'Tuticorin', 'India', 'Tuticorin', 'Commercial', 8.8041, 78.1348),
(150, 'Bandar Abbas', 'Iran', 'Bandar Abbas', 'Commercial', 27.1831, 56.2915),
(154, 'Bushehr', 'Iran', 'Bushehr', 'Commercial', 28.9684, 50.8385),
(156, 'Assaluyeh', 'Iran', 'Assaluyeh', 'Commercial', 27.4722, 52.6144),
(159, 'Chittagong', 'Bangladesh', 'Chittagong', 'Commercial', 22.3569, 91.7832),
(160, 'Mongla', 'Bangladesh', 'Mongla', 'Commercial', 22.4907, 89.5986),
(164, 'Kochi', 'India', 'Kochi', 'Commercial', 9.9312, 76.2673),
(165, 'Paradip', 'India', 'Paradip', 'Commercial', 20.3100, 86.6233)
ON CONFLICT (id) DO NOTHING;

-- Add some basic companies to handle company_id references
INSERT INTO companies (id, name) VALUES 
(1, 'Global Shipping Corp'),
(2, 'Maritime Holdings Ltd'),
(3, 'Ocean Transport Inc'),
(4, 'International Vessels Ltd'),
(5, 'Sea Cargo Company')
ON CONFLICT (id) DO NOTHING;