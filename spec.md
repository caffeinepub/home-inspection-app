# Home Inspection App

## Overview
A comprehensive home inspection application that allows inspectors to create detailed property inspection reports with photo documentation, annotations, and AI-assisted defect detection.

## Core Features

### Address and Property Lookup
- Integrate Google Places API for address autocomplete and lookup functionality
- Integrate RentCast API for property data fetching using GET endpoint with X-Api-Key authentication
- Configure API keys through environment variables in `.env` file for development
- Frontend configuration reads from `import.meta.env.VITE_GOOGLE_PLACES_API_KEY`, `import.meta.env.VITE_BATCHDATA_API_KEY`, and `import.meta.env.VITE_RENTCAST_API_KEY`
- Integrate BatchData MCP API to fetch property details and automatically generate room templates based on property type
- Use secure configuration management for API keys through environment variables
- Implement address autocomplete, verification, and property lookup using BatchData's JSON-RPC interface and RentCast API
- Query permit history and flag rooms as "High Priority" when permits were issued within the last 5 years
- Fetch property details (bedrooms, bathrooms, squareFootage, yearBuilt) from RentCast API when user enters an address
- Automatically create bathroom sections based on decimal values (e.g., 2.5 bathrooms creates 2 "Full-Bath" and 1 "Half-Bath")
- Derive inspection "Room Skeleton" dynamically using RentCast property attributes
- Display property details in inspection summary and metadata view
- Validate presence of API keys using environment variables with clear error messages if missing
- Display `.env` setup instructions in Settings page under API Configuration status section for developer visibility

### Photo Documentation and Annotation
- Allow users to upload multiple photos for each room/area of the inspection
- Provide in-browser annotation tools including:
  - Drawing tools for marking areas
  - Highlighting tools for emphasis
  - Text annotations and callouts
- Store annotated images with markup data
- Ensure uploaded photos remain persistently linked to their room and inspection records
- Maintain photo visibility after AI analysis completion
- Implement robust photo persistence with proper error handling and success notifications

### AI-Powered Analysis
- Implement simulated AI-based image analysis that automatically runs after photo upload
- Generate mock defect detection results including:
  - Random defect types (water damage, discoloration, cracks, electrical issues, structural concerns)
  - Confidence ratings (percentage scores)
  - Brief analysis descriptions
- Display loading animation during simulated analysis processing
- Show analysis results in photo preview area after completion
- Store AI analysis results with each photo for future reference
- Ensure processed photos with generated metadata are immediately attached to inspection data structure after analysis
- Prevent frontend state reset during AI analysis process
- Maintain consistent room object updates throughout the upload and analysis workflow

### Photo AI Scanning
- When a photo is uploaded, display a "Scanning…" animation
- Use simulated AI vision pipeline to analyze the image and auto-suggest captions describing common defects (cracks, leaks, mold, electrical issues, structural concerns)
- Display the generated caption in a preview field under the image
- Store AI-generated captions with each photo
- Ensure photo upload dialog waits for backend confirmation before updating UI state
- Display success and error notifications for upload and analysis processes

### Voice-to-Text Support
- Add microphone button beside each text input field for entering defect notes and observations
- Use browser's Web Speech API to transcribe live speech directly into input fields
- Display pulsing red recording indicator while recording is active
- Support voice input throughout the application for inspection notes

### AI Observation Refinement
- Display "✨ Refine" button next to text input fields once text is present
- Send observation text to simulated AI model that rewrites it into professional inspection notes with component, defect, and recommendation format
- Show preview modal of refined text with "Accept" and "Cancel" buttons
- Replace existing text when user accepts the refined version
- Store both original and refined text versions

### Voice and Text Features
- Implement text-to-speech functionality for commenting
- Use AI to refine and improve generated notes and comments
- Allow voice input for inspection notes

### PDF Report Generation
- Generate comprehensive PDF inspection reports containing:
  - Inspector and company information
  - Company logo
  - Table of contents
  - Executive summary
  - Detailed photo sections with annotations
  - AI analysis results and defect descriptions
  - AI-generated photo captions
  - Refined observation notes
  - RentCast property details (bedrooms, bathrooms, square footage, year built)
  - Recommendations

### Freemium Model
- Free tier limitations:
  - Maximum 2 photos per inspection
  - Maximum 1 report generation
- Paid tier unlocked via ICP token payments:
  - Unlimited photos per inspection
  - Unlimited report generation
  - Additional premium features

### Settings and Customization
- Company profile settings for uploading logo and contact information
- Inspector profile management
- Report template customization options
- API key configuration status display for Google Places, BatchData, and RentCast
- Display `.env` setup instructions for developers with required environment variables:
  - VITE_GOOGLE_PLACES_API_KEY=your_key_here
  - VITE_BATCHDATA_API_KEY=your_key_here
  - VITE_RENTCAST_API_KEY=your_key_here
- Show developer documentation in Settings page API Configuration section

### Mobile-Optimized and Accessible UI
- Large, thumb-friendly buttons for mobile use
- High-contrast design with light background and dark text
- Improved visibility on mobile devices
- Tactile spacing for all controls
- Accessible design patterns throughout the application
- Consistent photo thumbnail and AI results rendering in PhotoUploadDialog, RoomCard, and InspectionDetail components
- Eliminate photo disappearance after upload completion
- Clear user feedback through toast notifications for all photo operations
- Loading states and error handling for address lookups and permit flagging

## Backend Data Storage
- User accounts and subscription status
- Company profiles with logos and contact information
- Inspection records with associated photos, annotations, and AI analysis results
- RentCast property details (bedrooms, bathrooms, squareFootage, yearBuilt) stored with inspections
- AI-generated photo captions and refined observation text
- Original and refined text versions for observations
- Room templates and property data from BatchData lookups
- Payment records and ICP token transactions
- Generated reports and their metadata
- Persistent photo-to-room-to-inspection linkage data
- Inspection ownership mapping for proper data retrieval
- Property details including Year Built, Square Footage, Bedrooms, and Bathrooms
- Permit history data and high-priority room flagging

## Backend Operations
- User authentication and account management
- Photo upload and storage with annotation data and AI analysis results
- Simulated AI analysis generation and storage in photo records
- AI photo caption generation and storage
- AI text refinement processing for observation notes
- Integration with Google Places API for address autocomplete
- RentCast API integration for property data fetching with X-Api-Key authentication
- BatchData MCP integration via JSON-RPC for property lookups and permit history
- Automatic room skeleton generation based on RentCast and BatchData property data
- Dynamic bathroom section creation based on decimal bathroom values from RentCast
- High-priority room flagging based on recent permit history
- PDF report generation including AI analysis data, refined observations, and RentCast property details
- ICP token payment processing for premium upgrades
- Subscription tier management and access control
- Ensure proper data persistence and retrieval for photo-inspection relationships
- Maintain data integrity during AI analysis workflow
- Implement consistent room object updates in uploadPhoto and analyzePhoto operations
- Return updated room data to frontend after photo processing completion
- Provide proper error handling and status responses for photo operations
- Inspection creation with persistent storage and RentCast property data integration
- Data retrieval consistency for newly created inspections from persistent storage
- HTTP Outcalls module for JSON-RPC communication with BatchData MCP and RentCast API
