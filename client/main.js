/******************************************************************
 *  Runs once when the template is created
 *****************************************************************/
Template.d3_template.onCreated(function () {
    this.selectedCities = new ReactiveVar([]);
    this.path = new ReactiveVar();
    this.pathError = new ReactiveVar();
    this.pathDist = new ReactiveVar();

    /******************************************************************
     *  Sets the current proposed route for reactive rendering
     *****************************************************************/
    this.route = () => {
        let routeArr = this.selectedCities.get();
        let [source, target] = routeArr;

        return routeArr.length ? {
            source,
            target
        } : null;
    }

    /******************************************************************
     * Solves for shortest path between two selected cities
     *
     *   - Rough attempt at adapting what I could find on
     *     'a-star' and 'best-first' type graph traversal algorithms.
     *****************************************************************/
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

                if (closed.length > 0 && _.isMatch(target, nextCity)) {
                    this.pathError.set(true);
                    return;
                }

                console.log(nextCity);
                let routesIn = Routes.find({
                    target: nextCity.name
                }).fetch();

                let match = _.findWhere(routesIn, {
                    source: source.name
                });

                nextRoute = match || _.min(routesIn, 'distance');
                if (typeof (nextRoute.sourceCity) == 'function') {
                    nextCity = nextRoute.sourceCity();
                } else {
                    this.pathError.set(true);
                    return;
                }

                closed.push(nextRoute);
            }

            this.path.set(closed.reverse());
        }
    }
});

/******************************************************************
 *  Runs once when the template is rendered
 *****************************************************************/
Template.d3_template.onRendered(function () {

    console.log('Rendering scene...');
    let width = $(window).width(),
        height = $(window).height() - 170;

    let cities = Cities.find().fetch();
    let routes = Routes.find().fetch();

    let links = _.map(Routes.find().fetch(), r => ({
        source: _.findIndex(cities, c => r.source === c.name),
        target: _.findIndex(cities, c => r.target === c.name),
        distance: r.distance,
        type: 'standard'
    }));

    let force = d3.layout.force()
        .nodes(cities)
        .links(links)
        .size([width, height])
        .linkDistance(l => l.distance * 20)
        .charge(-2000)
        .on('tick', () => {
            path.attr('d', linkArc);
            node.attr('transform', transform);
        })
        .start();

    let svg = d3.select('.svg_container').append('svg')
        .attr('width', width)
        .attr('height', height);

    svg.append('svg:defs').selectAll('marker')
        .data(['end'])
        .enter().append('svg:marker')
        .attr('id', String)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', -.5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

    let path = svg.append('svg:g').selectAll('path')
        .data(force.links())
        .enter().append('svg:path')
        .attr('class', 'link')
        .attr('marker-end', 'url(#end)');

    let node = svg.selectAll('.node')
        .data(force.nodes())
        .enter().append('g')
        .attr('class', 'node')
        .attr('city', n => n.name)
        .on('click', click)
        .call(force.drag);

    node.append('circle')
        .attr('r', 5);

    node.append('text')
        .attr('x', 12)
        .attr('dy', '.35em')
        .text(n => n.name);

    /******************************************************************
     *  Maintains an array of 0 to 2 selected cities that constitue
     *  a proposed route to solve
     *****************************************************************/
    let setCitySelection = city => {
        let selection = this.selectedCities.get(),
            newSel = Cities.findOne({
                name: city
            });

        if (_.includes(_.pluck(selection, 'name'), city)) {
            selection = _.reject(selection, c => c.name === city);
        } else if (selection.length) {
            selection = [_.last(selection), newSel];
        } else {
            selection = [newSel];
        }
        this.selectedCities.set(selection);
    }

    /******************************************************************
     * Routes native d3 click event to custom handler
     *****************************************************************/
    function click(instance) {
        setCitySelection(
            d3.select(this).attr('city')
        );
    }

    function linkArc(d) {
        let dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    }

    function transform(d) {
        return `translate(${d.x},${d.y})`;
    }

    /******************************************************************
     * Runs whenever a city node is selected or de-selected
     *  - Sets or negates a 'selected' class by selection
     *  - forces the node circle to increase in diameter
     *  - scoots text over to make room for larger circle
     *****************************************************************/
    this.autorun(() => {
        let cities = this.selectedCities.get();

        let selector = _.map(
                cities, c => `.node[city=${c.name}]`
            ).join(','),
            selectedCities = _.pluck(
                cities, 'name'
            );

        let nodes = d3.selectAll('.node');

        nodes.filter(d => selectedCities.indexOf(d.name) > -1)
            .classed('selected', true);

        nodes.filter(d => selectedCities.indexOf(d.name) < 0)
            .classed('selected', false)
            .classed('source', false)
            .classed('target', false);

        nodes.filter(d => selectedCities[0] === d.name)
            .classed('source', true);

        nodes.filter(d => selectedCities[1] === d.name)
            .classed('target', true);

        nodes.each(function (d, i) {
            let node = d3.select(this),
                selected = node.classed('selected');

            node.classed('selected', selected);
            node.select('text')
                .attr('x', selected ? 14 : 12);
            node.select('circle')
                .attr('r', selected ? 9 : 6);
        });

        this.pathError.set(false);
        this.getPath();
    });

    this.autorun(() => {
        console.log(this.pathError.get());
    });

    /******************************************************************
     * Runs when a valid path is found between two cities
     *  - Sets a 'selected' class on all routes included in the solution
     *  - Updates the total distance reactive template var
     *****************************************************************/
    this.autorun(() => {
        let path = this.path.get(),
            distances = _.pluck(path, 'distance'),
            pathPoints = _.map(path, p => {
                return {
                    source: p.source,
                    target: p.target
                };
            }),
            links = d3.selectAll('.link');

        this.pathDist.set(
            _.reduce(distances, (total, d) => total + d)
        );

        links.filter(l => _.findWhere(pathPoints, {
            source: l.source.name,
            target: l.target.name
        }) !== undefined)
            .classed('selected', true);

        links.filter(l => _.findWhere(pathPoints, {
            source: l.source.name,
            target: l.target.name
        }) === undefined)
            .classed('selected', false);
    });
});

/******************************************************************
 * These are used to reactively re-render dom elements
 * in the template
 *****************************************************************/
Template.d3_template.helpers({
    route: function () {
        return Template.instance().route();
    },

    path: function () {
        return Template.instance().path.get();
    },

    pathError: function () {
        return Template.instance().pathError.get();
    },

    pathDist: function () {
        return Template.instance().pathDist.get();
    }
});