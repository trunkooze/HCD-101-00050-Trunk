// Numerical chart
fetch("nasa_numerical.csv")
  .then(res => res.text())
  .then(text => {
    const data = d3.csvParse(text);
    data.forEach(d => d.count = +d.count);

    const svg = d3.select("#numerical svg"),
          margin = { top: 20, right: 30, bottom: 30, left: 50 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom,
          g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.month)).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);

    g.append("g").call(d3.axisLeft(y));
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));

    const tooltip = d3.select("body").append("div")
      .attr("class", "bar-tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("color", "#000")
      .style("padding", "5px 10px")
      .style("border-radius", "5px")
      .style("box-shadow", "0 0 5px rgba(0,0,0,0.3)")
      .style("visibility", "hidden");

    g.selectAll("rect")
      .data(data)
      .enter().append("rect")
      .attr("x", d => x(d.month))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#66fcf1")
      .on("mouseover", function (event, d) {
        tooltip.style("visibility", "visible").text(`${d.month}: ${d.count}`);
        d3.select(this).attr("fill", "#45a29e");
      })
      .on("mousemove", function (event) {
        tooltip.style("top", `${event.pageY - 30}px`).style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
        d3.select(this).attr("fill", "#66fcf1");
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr("y", d => y(d.count))
      .attr("height", d => height - y(d.count));
  });

// Spatial map
window.map = L.map('map').setView([37.8, -96], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(window.map);

const facilities = [
  { name: "Kennedy Space Center", lat: 28.5721, lon: -80.6480 },
  { name: "Johnson Space Center", lat: 29.5597, lon: -95.0831 },
  { name: "Ames Research Center", lat: 37.4100, lon: -122.0630 },
  { name: "Goddard Space Flight Center", lat: 38.9955, lon: -76.8483 }
];

facilities.forEach(site => {
  L.marker([site.lat, site.lon]).addTo(window.map).bindPopup(site.name);
});

// Word frequency bubble chart
fetch("nasa_textual.csv")
  .then(res => res.text())
  .then(text => {
    const data = d3.csvParse(text);
    data.forEach(d => d.frequency = +d.frequency);

    const width = 800, height = 400;

    const svg = d3.select("#wordcloud")
      .html("") // clear previous
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "#1f2833");

    const tooltip = d3.select("#wordcloud")
      .append("div")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("color", "#000")
      .style("padding", "5px 10px")
      .style("border-radius", "5px")
      .style("box-shadow", "0 0 5px rgba(0,0,0,0.3)")
      .style("visibility", "hidden");

    const pack = d3.pack()
      .size([width, height])
      .padding(5);

    const root = d3.hierarchy({ children: data })
      .sum(d => d.frequency);

    const nodes = pack(root).leaves();

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const node = svg.selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .text(`${d.data.word}: ${d.data.frequency}`);
      })
      .on("mousemove", event => {
        tooltip.style("top", `${event.pageY + 10}px`)
               .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    node.append("circle")
      .attr("r", 0)
      .attr("fill", (d, i) => color(i))
      .transition()
      .duration(600)
      .attr("r", d => d.r);

    node.append("text")
      .style("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("fill", "white")
      .style("font-size", d => `${Math.max(d.r / 3, 10)}px`)
      .text(d => d.data.word);
  });