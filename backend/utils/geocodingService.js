const axios = require('axios');

const getLatLngFromAddress = async (address) => {
    console.log('Fetching lat/lng for address:', address);
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                q: address,
                format: 'jsonv2',
                addressdetails: 1,
                'accept-language': 'en',
                limit: 1
            },
            // Nominatim's usage policy requires a custom User-Agent identifying
            // the app — requests without one get a flat 403 Access Denied.
            headers: {
                'User-Agent': 'SFS-StudentFacilitySystem/1.0 (educational project)'
            }
        });
        // console.log('Response:', response);
        // console.log('Response:', response.data);
        if(response.data.length === 0) {
            console.log('No data found');
        }
        if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            return { lat: parseFloat(lat), lng: parseFloat(lon) };
        }
        return null;
    } catch (error) {
        console.error('Error fetching lat/lng:', error);
        return null;
    }
};

module.exports = getLatLngFromAddress;
