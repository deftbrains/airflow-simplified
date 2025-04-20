import { Component, AfterViewInit } from '@angular/core';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

dagre(cytoscape);  // Register Dagre extension immediately

@Component({
  standalone: true,
  selector: 'app-graph-test',
  template: `<div id="cy" class="cytoscape-container"></div>`,
  styles: [`
    .cytoscape-container {
      width: 100%;
      height: 500px;
      background-image: radial-gradient(#ccc 1px, transparent 1px);
      background-size: 20px 20px;
    }
  `]
})
export class GraphTestComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    cytoscape({
      container: document.getElementById('cy'),
      elements: [
        { data: { id: 'A', label: 'A' } },
        { data: { id: 'B', label: 'B' } },
        { data: { id: 'C', label: 'C' } },
        { data: { source: 'A', target: 'B' } },
        { data: { source: 'A', target: 'C' } },
      ],
      style: [
        {
          selector: 'node',
          style: {
            shape: 'rectangle',
            'background-color': '#fdeaea',
            'border-width': 1,
            'border-color': '#ccc',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px'
          }
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#555',
            'curve-style': 'bezier'
            // Arrowheads removed for plain lines
          }
        }
      ],
      layout: ({
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 50,
        edgeSep: 10,
        rankSep: 50
      } as any)
    });
  }
}