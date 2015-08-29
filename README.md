# MEAN Tracker for Node.js News

This app uses the [HN Algolia API](https://hn.algolia.com/api) to keep up-to-date with the latest [Node.js](https://nodejs.org/) news on [Hacker News](https://news.ycombinator.com/). I've tried to comment as much as I can in the code for anyone who takes a look, but if you have any questions, issues, or recommendations then please feel free to get in touch!

## Technologies Used

1. Backend
  - [Node.js](https://nodejs.org/)
  - [Express](http://expressjs.com/)
  - [MongoDB](https://www.mongodb.org/)
  - [Mongoose](http://mongoosejs.com/) - Making interacting with the database a tiny bit easier.
  - [request](https://github.com/request/request) - Making HTTP requests to the HN API
  - [async](https://github.com/caolan/async) - Managing asynchronous tasks in Node. Admittedly, this is probably used more than it needed to be, but having never used it before, I wanted to have a go with it. Initially, it was used in `populate.js` because I needed to make sure that I was inserting the data into the database after it had been validated.
  - [Moment](http://momentjs.com/) - It was used to convert times to Epoch for use within in HN API requests, to display and format times on the front end relative to the current time, and to just make working with times a whole lot easier.
  - [cron](https://github.com/ncb000gt/node-cron) - Used to automatically check for new Node.js posts on HN every hour.
2. Frontend
  - [Angular](https://angularjs.org/)
  - [angular-resource](https://docs.angularjs.org/api/ngResource/service/$resource) - Means we can fetch all of our posts with one line of code, hallelujah.
  - [angular-route](https://docs.angularjs.org/api/ngRoute/service/$route) - Controls all of the routing within the app.
  - Moment
  - [Bootstrap](http://getbootstrap.com)

## Setup & Usage

If you'd like to run this little app on your own machine, then here's how to do it. First, you should make sure you download this repository by either clicking the big ol' download button to the right or by cloning the repository. To clone the repository, open up your `Terminal`, `CMD` or whatever you want to use and enter the following:

```
git clone https://github.com/declanelcocks/mean-hacker-news-tracker.git
```

Voila, we're good to go. Navigate to the folder you've just downloaded and run this to install our server's dependencies.

```
npm install
```

If you open up `config.js` you'll notice that I am currently using a local instance of MongoDB to store the posts, so if you'd like to use a different database, replace the `db` value here. Remember that if you're running the app locally, you'll need to have an instance of MongoDB running locally too.

If it is your first time running the app, then you'll need to populate the database to make sure we have something to see and check against for new posts on HN. Run the command below and it will fetch the 20 most recent posts from the HN API and insert the valid posts into our database.

```
node populate.js
```

If it's not your first time running it, or you have just finished populating the database, go ahead and start up the server.

```
node server.js
```

We're done! Open up your favourite browser and go to `http://localhost:3000/` to see the app running!

### Notes
If you'd like to update the database on a more regular basis so you can see it in action, then you could try editing the `cronJob` function in `server.js` to the following:

```javascript
var cronJob = cron.job('0 * * * * *', function(){
  updatePosts();
});
```

This will change the cron task so that it runs every minute instead of every hour.