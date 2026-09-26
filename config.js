// config.js - Central configuration for pricing, games, and backend credentials

const APP_CONFIG = {
    // Supabase Backend Credentials
    supabaseUrl: 'https://mwxndccwzkcsyvslucjg.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eG5kY2N3emtjc3l2c2x1Y2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MTY1MjksImV4cCI6MjEwNTk5MjUyOX0.61NvDZ6cPnxLqoxJ4tr-H729a99h_XOAZDXo3zfx25g',

    // Jailbreak base prices by console model
    jailbreakPrices: {
        'OLED': 300,
        'V1_V2': 190,
        'LITE': 230
    },

    // SD Card retail prices if they buy a card from you (RM)
    sdCardRetailPrices: {
        64: 30,
        128: 45,
        256: 75,
        512: 140,
        1024: 280,
        2048: 600
    },

    // Additional system mode pricing (+RM30 each)
    addonPrices: {
        android: 30,
        linux: 30
    }
};

// Your game catalog library - automatically updated by your PowerShell script!
const games = [

    ];


