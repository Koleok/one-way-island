#one-way-island
An exercise in pathfinding

---

#Things to know
- This project was built in meteor, which is currently my most loved js framework. I can't imagine that changing, ever, but we'll see.
- I use [babel](https://babeljs.io/) whenever possible to transpile to the new [es6](http://es6-features.org/#Constants) standard and take advantage of the delicious new features and syntax. This is the case for this project as well so if anything seems syntactically unfamiliar just refer to the standards documentation. *([MDN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) are a rich resource on this topic)* 

---

#Installation
###These instructions assume the target system does **not** have meteor installed.

**For OS X or Linux**

*Install the latest official Meteor release from your terminal:*

`curl https://install.meteor.com/ | sh`

-

**For Windows (just use a mac, i mean come on this is unix stuff...)**

[Download the official Meteor installer](https://install.meteor.com/windows)

-

**In a terminal window _(or cmd prompt for windows)_, cd to desired folder and clone the github repository with the following command**

`git clone https://github.com/Koleok/one-way-island.git`

**cd to the newly created folder**

`cd one-way-island`

**start the app**

`meteor`

Navigate to the app @ [localhost:3000](localhost:3000)


---

#Initial thoughts
###Right from the starting gate there are a few vital decisions to make concerning process within this project.

-

**1. Should I put the emphasis on completion and turnaround by aggressively searching for a similar solution someone has already posted on Github, Stack Overflow, Quora etc... and simply extending it to fit the specs?**

- The good: 

	- The business has a product sooner.

	- The employee has incurred less cost overall 

	- The ability to pull together existing modules and stitch them into a functional product without reinventing the wheel is central to this field, and so arguably just as important to demonstrate competency in. This could show business sense and level headedness in contrast to a disproportionate focus on stimulating engineering problems _(vs timely results)_.

	- Being that the goal of almost any project in business is to achieve a functional result within a given time window, it would stand to reason that a faster result with similar quality as its slower counterpart, is the **better** result.

- The bad:

	- Since the implied purpose of the assignment is to gauge technical ability, presenting a solution with too much existing  could be perceived as a dodge, which at best is *not useful*, and at worst may seem _unethical_.

	- Could be perceived as an indicator for lack of work ethic *(which would be a mistake in my opinion :) )*.

	
**2. To extend or not to extend, are the _stretch objectives_ a way to show research skills and versatility? or an opportunity to demonstrate restraint and focus?**

- Extend:

	- 	Will take longer without a doubt.

- Don't Extend:

	- Quick turn around, but employer gains limited perspective on my working habits, thought patterns, work ethic etc... 

###I will return to these points at the end of the document to record which paths I actually took in the course of development and why.

---	
#Lessons and Issues per task
*Things learned and dangling questions recorded for each significant block of work within the project*

-

###Shortest path between two cities problem.

A very interesting one for me, on the surface it seemed like I should be able to write a simple recursive function to solve it in under 10 minutes. The further dug though, it became clear that this was a classic *graph traversal theory* problem that has been attacked by generations of game designers and robotics scientists. I thought, *"why not benefit from their countless hours of toil and head scratching?"* The problem seems to fit nicely in terms of a pathfinding tree with nodes and directed edges. The issue of encoding the problem correctly prior to handing it off to an appropriate algorithm is where the bulk of the work lies in these scenarios as far as I'm concerned. That it did. 

Current function that provides the meat of the pathfinding

```javascript
this.getPath = () => {
        let route = this.route();

        if (route && route.target) {
            let {
                source, target
            } = route;

            var closed = [],
                nextCity = target,
                nextRoute = {};

            while (!_.isMatch(source, nextCity)) {
                let routesIn = Routes.find({
                    target: nextCity.name
                }).fetch();

                let match = _.findWhere(routesIn, {
                    source: source.name
                });

                nextRoute = match || _.min(routesIn, 'distance');
                nextCity = nextRoute.sourceCity();
                closed.push(nextRoute);
            }

            this.path.set(closed.reverse());
        }
    }
```

- **Outstanding issues** *(still in active dev)*

	- Distilling the one-way relationships of the routes between island cities into a structure that fit cleanly inside of something like an *a-star* search _(which falls under the **directed graph** category in pathfinding)_ was a real puzzler for me. A noted difference from the a-star standard that one reviewing my code for this might notice, is a lack of any suitable heuristic function. A heuristic in this context serves as a baseline to help determine the cost of movement to each subsequent node, and thus allows an accurate estimate of the next best node in the solution array. My solution, instead finds the neighbors of the current node, and simply prefers the shortest directed edge *(route distance)* from among them. This leads to some solutions that turn out questionable in terms of optimization.

	- I would like to move this logic into a server-side package and use a well organized chained promise *(or using `Promise.all()` with a promise array which is available in most promise libraries)* 

	- There are two conditions in the pathfinding that create an infinite evaluation loop which is something I am still working out. **If one of these conditions is encountered when running the project locally, the browser must usually be force closed, or alternatively the debugger can be paused which should allow the tab to close.** These conditions occur specifically when:
		- Selecting nodes that have only a **single directed edge** associated with them that leads either in or out, as either the start or end of the route.
		- When, during the iteration, a neighbor node is selected by shortest distance **(see line 22 in code snippet)**, which **cannot** cannot result in a valid path to the end of the route. _(I have not given the algorithm any way to **know** this at the time of evaluation, so it remains an active bug I trying to resolve for now)_. 

- **Sources**
	- [Simulated annealing (for d3 mostly)](https://en.wikipedia.org/wiki/Simulated_annealing)
	- A*
		- [A* wikipedia](https://en.wikipedia.org/wiki/A*_search_algorithm)
		- [https://www.youtube.com/watch?v=ntBsg9TJJMw](https://www.youtube.com/watch?v=ntBsg9TJJMw)
		- [https://www.youtube.com/watch?v=DhtSZhakyOo](https://www.youtube.com/watch?v=DhtSZhakyOo)
		- An npm [astar module](https://www.npmjs.com/package/a-star) that I did not end up using, but was able to learn a good deal from reading the source code.
	- [General path solver reading](https://en.wikipedia.org/wiki/Shortest_path_problem)
	- [Refresh on binary search :) ](https://en.wikipedia.org/wiki/Binary_search_algorithm)

###Introduction to D3 library

I am now completely in love with this library. I had come across it many times in the past and considered using it for various projects, but timelines and skeptical bosses usually drove me to use something like [highcharts](http://www.highcharts.com/) or [chart.js](http://www.chartjs.org/). 

- **Notes**
	- Integrating with meteor was interesting, I was able to use [this article](https://meteor.hackpad.com/Meteor-Cookbook-Reactive-D3-Visualizations-YUR9JT4mrm9) to get a head start and start hacking into the weeds from there.

	- Generally using svg **reactively** in meteor is something this project has made me realize that I need to take advantage of much more often. It can really simplify some things that are mighty complex otherwise _(in terms of **[event based spaghetti](http://zef.me/blog/3715/three-routes-to-spaghetti-free-javascript)**)_

- **Outstanding issues**

	- I think I am missing some event fires as a result of using the Meteor `Template.foo.onRendered()` event to handle all of the d3 setup. This will manifest in the form of a blank diagram on screen refresh from time to time. Usually closing the tab and opening a new one will do the trick, again something that I am working out, shouldn't be too complex.

- **Sources**
	- Of course mbostock's [mobile patent suits](http://bl.ocks.org/mbostock/1153292)
	- Article on d3 [classed()](http://jaketrent.com/post/d3-class-operations/)

---

#Closing Thoughts
###Reflecting on initial impressions

- On existing code re-use
	- Regardless of my note taking on this topic, the decision was made for me by way of how very little I could find on the internet that related **directly** to solving a problem of this description. Therefore there is essentially no code re-use other than what I was able to glean from mbostock's now famous [mobile patent suits](http://bl.ocks.org/mbostock/1153292) d3 code.

	- On the bright side, I did learn a whole heck of a lot by searching through lots of plain-text courses published by colleges on the topics of *pathfinding* and *graph traversal*.

- On **stretch objectives**
	- Basically, if there is any conceivable way to justify going to extra mile without costing someone money or time, my preference is to do it. I completely love delving into the unknown like this and later bubbling back up to the surface with cool new knowledge and skills.

    - Since I was unable to find a module that truly fit the primitive *state space* pathfinding in this project, I am going to to build an *a-star-primitive* npm module and corresponding meteor package to handle these situations on future projects, again I like finding an excuse to do this :)

 
