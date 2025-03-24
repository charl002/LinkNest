# Meeting Logs

### 2025-02-11

We have started creating the issues for the project for the first sprint, and we will decide how to separate the tasks and assigning weights to each issue after. Right now we are down a teammate (Charles) due to him being sick, so when he is back we can organize better.

Right now Mohammed is setting up Firebase, Adbullah is going to setup the layout for the home page, Ahmed will start creating the API routes and I will start creating the tests folder and forms.

Author: Thiha

### 2025-02-18

Charles created the **GET and POST API** routes for the News API and BlueSKY, and he also cleaned up & assigned the Gitlab issues. He will be working on making the **Posts** appear on the website (for the News and BlueSky).

As of Mohammed, he created the GET and POST API's for the users, and connect it to Firebase. He also implemented unique usernames. He will work on implementing the **profile page**.

Ahmed implemented **Google Auth** and is now working on users posting on the application.

I fixed the Jest testings since it was causing issues for the pipeline. I also added the chatting feature, but sonme bugs are still there so I need to fix them before I merge to **staging**. I will work next on fixing the chatting and implementing the connection between users.

Adbullah worked on the **Gitlab CI** and the layout for the home page. He is going to work next on the POST API and the GET for the custom posts users can make.

Author: Thiha

### 2025-02-21

We had a retrospective meeting with Jaya, and we discussed together in a group what we worked on and if we felt like the tasks were equal. After everyone opinions, we have come to a conclusion that we should seperate the tasks in a way that not a certain group of people work on the front while the other group works on the back. This issue arised due to having our product manager being sick at the start of the sprint, so we will fix that next time.

As of what we will do next, we will try to fix the Azure deployment for submission.

Author: Thiha

### 2025-02-24

We started the sprint 2 planning, and assigned tasks to everyone equally. We also started adding more issues in the backlog so when we are finishing our issues, we are able to keep working on new features to add for the project.

Author: Thiha

### 2025-02-25

Today we will decide on which feature we will champion. 

Charles will do Automation and Moderation. He is planning to implement the likes and comments with posts with Abulluah.

Adbullah will focus on performance. As mentioned before, he will help Charles do the likes and comments.

Ahmed is going to champion Accessibility & Internalization, and for the next step, he is going to store the messages in the database.

Mohammed will finish up the profile page and the video chatting between users.

Thiha will focus on the front-end testing and improving the community aspect of the application.

As in group, we will also focus on adding tests for the API Routes we created.

Author: Thiha

### 2025-02-28

Today in class, we had a workshop today regarding bugs, and we let another team test our deployed website. They started creating issues for us and we did the same for another team.

We then had a meeting to see what everyone has worked on, and what they will work on in the future.

**Mohammed**: He worked on updating the profile picture and the background image, and he is planning to add video calling next.

**Charles**: He has set up the likes for the posts and fixed bugs related to it. Charles is planning to add likes to comments when they are implemented, and adding a tab for the bluesky and news. He is also thinking about the hashtags tab.

**Ahmed**: Ahmed worked on storing the messages in the database, and now he is going to fix on a bug regarding the order of the message (DUe to the time being minutes).

**Abdullah**: He has improved the 'create post' page, specifically so that is has better user interaction and redirects to home after creation. He also started optimizing the application, improving by 17%. He will now focus on adding comments.

**Thiha**: I added websockets for production, meaning you are able to message another person on the deployed website. I am now going to focus on adding authentication for the chats, and improving the experience of the website by removing the need to refresh constantly to update the website.

### 2025-03-03

**Charles**: He has fixed the likes for posts (Before you could spam click), and he fixed the fetches regarding the likes for every posts. He will now do testing for his API routes and he will also implement likes with the comments.

**Ahmed**: He fixed the bug regarding the order of the messages, due to how it was ordering by minutes and not seconds. Also, Ahmed resolved the issue where you can add multiple friends by spam clicking. He will now work limiting the characters and start new unit tests for the API routes.

**Adbullah**: He fixed the like button to be more responsive, and now he has also added comments for posts. He will polish the comments more and start optimization. He will also do some testings.

**Mohammed**: He implemented the profile picture being updated. For next, he will also implement adding videocalling and polishing the profile picture update due to a bug.

**Thiha**: I added authentication for the chatting, meaning you can't access another user's chat. I also used socket IO to make friend requests appear in real time, and when accepting a friend request. I will now also implement declining a friend request and removing a friend. I also will fix chatting.

### 2025-03-07

Today was the retrospective meeting with Jaya. All and all, we were pretty satisfied with the work we have done in this sprint. But, we do notice that our team has not taken care of the issue board that much, which is a problem if one of the member finishes a task, but its unclear on what to tackle next. We also noticed that some of our issues were too ```broad```, so next time we should create smaller issues with distinct goals.

Another issue is the lack of documentation and modularity in our code, and we have now started to work on this (And continue working on it for Sprint 3).

As of what we all worked on for the Sprint 2 submission:

**Charles**: Fixed the redundancy of /home and /, and now the 'home' is in root ```/```. He also worked on the filtering of the posts, between _Posts_, _News_ and _BlueSky_ with **Ahmed**. Finally, he worked also on fixing bugs.

**Ahmed**: As mentioned before, he helped **Charles** do the filtering for the posts. He also worked on bug fixes.

**Abdullah**: He fixed the profile pictures not appearing in the comment section, fixed bugs related to the comment not blurring everything in the background, and he also implemented posting videos + validation for it.

**Mohammad**: Mohammad added a create post button on the profile page, made it so you can click on a user in ```/chat```, you will go to their profile and added a pending request section.

**Thiha**: As of me, I fixed bugs related to the ```unread messages``` functionality, added quality of life improvements in ```/chat```, and finally added a test for ```helloworld``` api route, that mocks the server.

### 2025-03-10

We demo'ed our project in front of the class, and we limit tested our deployed application on Render.

**Charles**: Will fix clipping issue with the comments. He will also fix fetching error on deployment regarding the BlueSky Posts.

**Mohammad**: He will focus on deletion of different parts of the application, like user, posts, comments, etc.

**Abdullah**: He will focus on performance, like adding caching and lazy loading for the posts.

**Ahmed**: He will fix the logging out your account bug. Ahmed will also add reactions and emojis to messages in the chat. He will also implement replying to messages.

**Thiha**: I will add toasts for when a video call is happening, and put a message when a call happens. I will also start the group chats.

Also, as a team, we will implement the testings for our API routes.

These tasks are expected to be due by Sunday, meaning March 16th. We are going to have check-ups when we have in class sessions.

### 2025-03-24

We are conflicted on what is more priority, either fixing the testing or implementing the group chats. As a group, we decided that testing is more important, so I will try to figure it out today, and let the team know if we need to change the testing strategy.

**Ahmed**: He completed the reactions for messages and started the mobile CSS. The next thing he will do is finish up the Mobile CSS.

**Adbullah**: He implemented browser and server caching for the whole application, and he will now optimize more the applicatin and start monitoring.

**Mohammed**: He implemented encryption for the videocall aspect of the application, and fixed bugs related to the call. He will now add encryption for videocall and help Abdullah with monitoring.

**Charles**: He added pagination of the posts, basically an 'infinite scrolling effect'. He also implemented the CRON job for the bluesky posts and news posts.  He will now do monitoring of the application and the report system.

**Thiha**: I implemented 'yellow' message blocks that represent call messages in the Chat, I also added notifications for the calls and fixed websockets for when a friend request is sent. I also fixed the CSS for the app, making it non-scrollable. I will now focus on testing and groupchats.