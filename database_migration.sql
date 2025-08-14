-- Step 1: Add missing fields to LMRoomDescription
ALTER TABLE LMRoomDescription 
ADD COLUMN active_status TINYINT(1) DEFAULT 1,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Step 2: Create LMGeneralConfig table for global settings
CREATE TABLE LMGeneralConfig (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 3: Insert default global configuration values
INSERT INTO LMGeneralConfig (config_key, config_value, description) VALUES
('child_age_limit', '12', 'Children below this age count as children for booking purposes'),
('default_privacy_level', 'Full Privacy', 'Default privacy level for new villas'),
('default_pool_type', 'Private Pool', 'Default pool type for new villas'),
('default_villa_class', 'Premium', 'Default villa class for new villas');

-- Step 4: Update LMRoomDescription with active_status from LMvilla_config
UPDATE LMRoomDescription lrd 
SET lrd.active_status = (
    SELECT lvc.active_status 
    FROM LMvilla_config lvc 
    WHERE lvc.villa_name = CASE 
        WHEN lrd.name = 'The Pearl Villa' THEN 'Pearl & Shell'
        WHEN lrd.name = 'The Leaf Villa' THEN 'Leaf'
        WHEN lrd.name = 'The Shore Villa' THEN 'Shore'
        WHEN lrd.name = 'The Sunset Room' THEN 'Sunset Room'
        WHEN lrd.name = 'The Swell 2BR' THEN 'Swell 2BR'
        WHEN lrd.name = 'The Swell 3BR' THEN 'Swell 3BR'
        WHEN lrd.name = 'The Swell 4BR' THEN 'Swell 4BR'
        WHEN lrd.name = 'The Tide Villa' THEN 'Tide'
        WHEN lrd.name = 'The Wave Villa' THEN 'Wave'
        ELSE lrd.name
    END
);

-- Step 5: Verify the migration
SELECT 
    lrd.villa_id,
    lrd.name,
    lrd.active_status,
    lrd.created_at,
    lrd.updated_at
FROM LMRoomDescription lrd
ORDER BY lrd.villa_id;

-- Step 6: Show global configuration
SELECT * FROM LMGeneralConfig ORDER BY config_key;