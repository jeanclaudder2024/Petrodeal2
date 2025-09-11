-- Check current ports in the table
SELECT id, name, country, city FROM ports ORDER BY id LIMIT 10;

-- Check how many ports we have total
SELECT COUNT(*) as total_ports FROM ports;

-- Add some sample ports to cover the IDs being referenced
INSERT INTO ports (id, name, country, city, port_type, lat, lng) VALUES 
(1, 'Rotterdam', 'Netherlands', 'Rotterdam', 'Commercial', 51.9244, 4.4777),
(2, 'Singapore', 'Singapore', 'Singapore', 'Commercial', 1.2966, 103.8006),
(3, 'Shanghai', 'China', 'Shanghai', 'Commercial', 31.2304, 121.4737),
(4, 'Hamburg', 'Germany', 'Hamburg', 'Commercial', 53.5511, 9.9937),
(5, 'Antwerp', 'Belgium', 'Antwerp', 'Commercial', 51.2213, 4.4051),
(6, 'Los Angeles', 'USA', 'Los Angeles', 'Commercial', 33.7365, -118.2645),
(7, 'Long Beach', 'USA', 'Long Beach', 'Commercial', 33.7701, -118.1937),
(8, 'New York', 'USA', 'New York', 'Commercial', 40.6693, -74.0465),
(9, 'Dubai', 'UAE', 'Dubai', 'Commercial', 25.2697, 55.3094),
(10, 'Hong Kong', 'Hong Kong', 'Hong Kong', 'Commercial', 22.2908, 114.1501),
(11, 'Busan', 'South Korea', 'Busan', 'Commercial', 35.1796, 129.0756),
(12, 'Qingdao', 'China', 'Qingdao', 'Commercial', 36.0986, 120.3719)
ON CONFLICT (id) DO NOTHING;