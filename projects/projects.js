import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

let newData = [];
let query = '';
let selectedIndex = -1;
let searchInput = document.querySelector('.searchBar');

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(projectsGiven, v => v.length, d => d.year);
  newData = newRolledData.map(([label, value]) => ({ label, value }));

  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let sliceGenerator = d3.pie().value(d => d.value);
  let arcData = sliceGenerator(newData);
  let arcs = arcData.map(d => arcGenerator(d));
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  d3.select('#projects-pie-plot').selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  let svg = d3.select('#projects-pie-plot');

  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg.selectAll('path')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

        legend.selectAll('li')
          .attr('class', (_, idx) => idx === selectedIndex ? 'legend-item selected' : 'legend-item');

        if (selectedIndex === -1) {
            let filtered = projects.filter((project) => {
                let values = Object.values(project).join('\n').toLowerCase();
                return values.includes(query.toLowerCase());
            });
            renderProjects(filtered, projectsContainer, 'h2');
            }else{
            let selectedYear = newData[selectedIndex].label;
            let filtered = projects.filter(p => {
                let values = Object.values(p).join('\n').toLowerCase();
                return p.year === selectedYear && values.includes(query.toLowerCase());
            });
            renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });

  let legend = d3.select('.legend');
  newData.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

renderPieChart(projects);
renderProjects(projects, projectsContainer, 'h2');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    let matchesQuery = values.includes(query.toLowerCase());
    let matchesYear = selectedIndex === -1 || project.year === (newData?.[selectedIndex]?.label);
    return matchesQuery && matchesYear;
  });
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(projects);
});