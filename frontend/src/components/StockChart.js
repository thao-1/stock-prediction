import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { format } from 'date-fns';

const StockChart = ({ data }) => {
  const chartRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse dates and ensure data is sorted by date
    const parseTime = d3.timeParse('%Y-%m-%d');
    const formattedData = data
      .map(d => ({
        ...d,
        date: parseTime(d.date),
        close: +d.close,
        ma20: d.ma_20 ? +d.ma_20 : null,
        ma50: d.ma_50 ? +d.ma_50 : null
      }))
      .sort((a, b) => a.date - b.date);

    // Set up scales
    const x = d3.scaleTime()
      .domain(d3.extent(formattedData, d => d.date))
      .range([0, width]);

    // Find min/max values for y-scale, excluding null/undefined values
    const allValues = formattedData.flatMap(d => [
      d.close,
      d.ma20,
      d.ma50
    ].filter(v => v !== null && !isNaN(v)));

    const y = d3.scaleLinear()
      .domain([
        d3.min(allValues) * 0.98,
        d3.max(allValues) * 1.02
      ])
      .range([height, 0]);

    // Add X axis
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));

    // Add Y axis
    svg.append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d}`));

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat('').tickValues(y.ticks(5)));

    // Add line for closing price
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.close))
      .defined(d => d.close !== null);

    svg.append('path')
      .datum(formattedData)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', '#3498db')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add 20-day moving average if available
    const ma20Data = formattedData.filter(d => d.ma20 !== null);
    if (ma20Data.length > 0) {
      const ma20Line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.ma20));

      svg.append('path')
        .datum(ma20Data)
        .attr('class', 'ma20-line')
        .attr('fill', 'none')
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5')
        .attr('d', ma20Line);
    }

    // Add 50-day moving average if available
    const ma50Data = formattedData.filter(d => d.ma50 !== null);
    if (ma50Data.length > 0) {
      const ma50Line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.ma50));

      svg.append('path')
        .datum(ma50Data)
        .attr('class', 'ma50-line')
        .attr('fill', 'none')
        .attr('stroke', '#2ecc71')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5')
        .attr('d', ma50Line);
    }

    // Add legend
    const legendItems = [
      { label: 'Close Price', color: '#3498db', class: 'line' },
      ...(ma20Data.length > 0 ? [{ label: '20-Day MA', color: '#e74c3c', class: 'ma20-line' }] : []),
      ...(ma50Data.length > 0 ? [{ label: '50-Day MA', color: '#2ecc71', class: 'ma50-line' }] : [])
    ];

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 10)`);

    legend.selectAll('g')
      .data(legendItems)
      .enter()
      .append('g')
      .attr('transform', (_, i) => `translate(0, ${i * 20})`)
      .each(function(d) {
        const g = d3.select(this);
        g.append('rect')
          .attr('width', 15)
          .attr('height', 2)
          .attr('y', 9)
          .attr('fill', d.color);
        
        g.append('text')
          .attr('x', 25)
          .attr('y', 10)
          .attr('dy', '0.35em')
          .style('font-size', '12px')
          .style('fill', '#7f8c8d')
          .text(d.label);
      });

    // Add tooltip
    const tooltip = d3.select(chartRef.current)
      .append('div')
      .attr('class', 'd3-tooltip')
      .style('opacity', 0);

    // Add mouse tracking
    const mouseG = svg.append('g')
      .attr('class', 'mouse-over-effects');

    mouseG.append('path')
      .attr('class', 'mouse-line')
      .style('stroke', '#7f8c8d')
      .style('stroke-width', '1px')
      .style('opacity', '0')
      .style('pointer-events', 'none');

    mouseG.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', function() {
        d3.select('.mouse-line').style('opacity', '0');
        tooltip.style('opacity', 0);
      })
      .on('mousemove', function(event) {
        const mouse = d3.pointer(event);
        const x0 = x.invert(mouse[0]);
        const bisectDate = d3.bisector(d => d.date).left;
        const i = bisectDate(formattedData, x0, 1);
        const d0 = formattedData[i - 1];
        const d1 = formattedData[i];
        
        if (!d0 || !d1) return;
        
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        
        // Update vertical line
        d3.select('.mouse-line')
          .style('opacity', '0.5')
          .attr('d', () => `M${x(d.date)},${height} ${x(d.date)},0`);

        // Update tooltip
        tooltip
          .style('opacity', 1)
          .html(`
            <h4>${format(d.date, 'MMM d, yyyy')}</h4>
            <p>
              <span class="label">Close:</span>
              <span class="value">$${d.close?.toFixed(2) || 'N/A'}</span>
            </p>
            ${d.ma20 !== null ? `
              <p>
                <span class="label">20-Day MA:</span>
                <span class="value">$${d.ma20?.toFixed(2)}</span>
              </p>
            ` : ''}
            ${d.ma50 !== null ? `
              <p>
                <span class="label">50-Day MA:</span>
                <span class="value">$${d.ma50?.toFixed(2)}</span>
              </p>
            ` : ''}
            <p>
              <span class="label">Volume:</span>
              <span class="value">${d.volume?.toLocaleString() || 'N/A'}</span>
            </p>
          `)
          .style('left', `${Math.min(x(d.date) + margin.left + 20, width + margin.left - 180)}px`)
          .style('top', `${Math.min(y(d.close) + margin.top, height + margin.top - 100)}px`);
      });

    // Handle window resize
    const handleResize = () => {
      const newWidth = chartRef.current.clientWidth - margin.left - margin.right;
      
      // Update SVG width
      d3.select(chartRef.current).select('svg')
        .attr('width', newWidth + margin.left + margin.right);
      
      // Update x scale and axis
      x.range([0, newWidth]);
      svg.select('.x-axis')
        .call(d3.axisBottom(x).ticks(5));
      
      // Update grid lines
      svg.select('.grid')
        .call(d3.axisLeft(y).tickSize(-newWidth).tickFormat('').tickValues(y.ticks(5)));
      
      // Update lines
      svg.select('.line')
        .attr('d', line);
      
      if (ma20Data.length > 0) {
        svg.select('.ma20-line')
          .attr('d', d3.line()
            .x(d => x(d.date))
            .y(d => y(d.ma20)));
      }
      
      if (ma50Data.length > 0) {
        svg.select('.ma50-line')
          .attr('d', d3.line()
            .x(d => x(d.date))
            .y(d => y(d.ma50)));
      }
      
      // Update legend position
      legend.attr('transform', `translate(${newWidth - 150}, 10)`);
      
      // Update mouseover rect
      mouseG.select('rect')
        .attr('width', newWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width: '100%', 
        height: '400px',
        position: 'relative'
      }} 
    />
  );
};

export default StockChart;