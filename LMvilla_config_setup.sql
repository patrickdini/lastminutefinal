-- Create LMvilla_config table for Villa Tokay configuration management
CREATE TABLE LMvilla_config (
    villa_name VARCHAR(100) PRIMARY KEY,
    bedrooms INT NOT NULL DEFAULT 1,
    max_adults_per_unit INT NOT NULL DEFAULT 2,
    max_guests_per_unit INT NOT NULL DEFAULT 2,
    privacy_level ENUM('Private', 'Semi-Private', 'Shared') DEFAULT 'Private',
    pool_type ENUM('Private', 'Shared', 'None') DEFAULT 'Private',
    villa_class ENUM('Luxury', 'Premium', 'Standard', 'Budget') DEFAULT 'Standard',
    child_age_limit INT DEFAULT 12,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Populate table with existing villa data from RoomAvailabilityStore
INSERT INTO LMvilla_config (villa_name, bedrooms, max_adults_per_unit, max_guests_per_unit, privacy_level, pool_type, villa_class, child_age_limit, active_status) VALUES
('Leaf', 1, 2, 2, 'Private', 'Private', 'Premium', 12, TRUE),
('Pearl & Shell', 2, 4, 4, 'Private', 'Private', 'Luxury', 12, TRUE),
('Shore', 2, 4, 4, 'Private', 'Private', 'Premium', 12, TRUE),
('Sunset Room', 1, 2, 2, 'Private', 'Private', 'Standard', 12, TRUE),
('Swell 2BR', 2, 4, 4, 'Private', 'Private', 'Premium', 12, TRUE),
('Swell 3BR', 3, 6, 6, 'Private', 'Private', 'Luxury', 12, TRUE),
('Swell 4BR', 4, 8, 8, 'Private', 'Private', 'Luxury', 12, TRUE),
('Tide', 1, 2, 2, 'Private', 'Private', 'Standard', 12, TRUE),
('Wave', 1, 2, 2, 'Private', 'Private', 'Standard', 12, TRUE);

-- Verify the data was inserted correctly
SELECT * FROM LMvilla_config ORDER BY villa_name;