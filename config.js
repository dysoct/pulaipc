// config.js - Central configuration for pricing, games, and backend credentials

var APP_CONFIG = {
    // Supabase Backend Credentials
    supabaseUrl: 'https://mwxndccwzkcsyvslucjg.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eG5kY2N3emtjc3l2c2x1Y2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MTY1MjksImV4cCI6MjEwNTk5MjUyOX0.61NvDZ6cPnxLqoxJ4tr-H729a99h_XOAZDXo3zfx25g',

    // WhatsApp Contact Number
    whatsappNumber: '601165676869', // Replace with your actual number

    // Jailbreak base prices by console model
    jailbreakPrices: {
        'OLED': 300,
        'V1_V2': 190,
        'LITE': 230
    },

    // System Setup flat base price (RM)
    systemSetupPrice: 50,

    // SD Card retail prices if they buy a card from you (RM)
    sdCardRetailPrices: {
        128: 110,
        256: 200,
        512: 400,
    },

    // Additional system mode pricing (+RM30 each)
    addonPrices: {
        android: 30,
        linux: 30
    }
};

// Your game catalog library - automatically updated by your PowerShell script!
var games = [
      { name: "1-2-Switch", size: 1.39 },
      { name: "A Little to the Left", size: 1.91 },
      // ... keep the remainder of your game array exactly the same
];
