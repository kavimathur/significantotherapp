Objective: write a doc describing an iOS app to help you be a good significant other to your girlfriend

Technology: This should work as a progressive webapp, optimized for iOS. We can deploy this on vercel. If we need a backend, let's use Supabase. If you need details on Supabase or Vercel accounts, please ask for them specifically, with guidance on how to access those details.

Problem: Sometimes it’s hard to keep track of everything you need to for your girlfriend. This app helps you keep a log of important details in her life, things you’ve done together, and ideas for gifts, dates, and other things.

App Layout: The app will consist of four main pages, as explained in the "Pages" section of this document. These can be navigated to via a navigation bar at the bottom of the screen. When there is a function to create a new object on any of the pages, this should take the form of a "+" button in the top-right hand of the screen.

Onboarding: The user should be asked what their girlfriend's name is on an opening page before getting access to the rest of the app.

Pages:
- Chat
- People
- Ideas
    - Gifts
    - Dates
- Recommendations
- Notepad

Descriptions for each page can be found below:

Chat: This is a chatbot that the user can talk to. The chatbot should have full context on the rest of the user inputs in this app from the other pages.

People: This is a log of all of the people in the user's girlfriend's life. The page should appear as a collection of bubbles, one bubble for each person. The user can create a new "person" and then add notes to that person. The user can also edit and delete person bubbles.

Ideas: This page has two tabs - one for gifts and one for dates. The user can create a new "date" item which includes optional fields for date name, a link, and a description. If the link is a google maps link, the app should pull the first image of the google maps page and autopopulate the title. It should also show location on a map.

Recommendations: Based off of context captured from the user's inputs over time, the app should periodically push recommendations to the user about gifts to buy, dates to go on, and cute things to send her.

Notepad: This is a notebook for the user to journal or make notes about their girlfriend. The user can make several entries, which appear in subsequent lines on a menu. The app should load each entry into context for the recommendation tool and chat function.
