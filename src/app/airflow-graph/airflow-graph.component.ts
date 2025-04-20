import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import cytoscape, { Core } from 'cytoscape';
import elk from 'cytoscape-elk';
import { AirflowGraphService, Dag } from './airflow-graph.service';

elk(cytoscape);

@Component({
  standalone: true,
  selector: 'app-airflow-graph',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './airflow-graph.component.html',
  styleUrls: ['./airflow-graph.component.css']
})
export class AirflowGraphComponent implements OnInit, AfterViewInit {
  private cy!: Core;
  private airflowService = inject(AirflowGraphService);

  dags: Dag[] = [];
  selectedDagId: string | null = null;
  loading = true;

  ngOnInit(): void {
    this.airflowService.getDags().subscribe({
      next: (res: { dags: Dag[] }) => {
        this.dags = res.dags;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  ngAfterViewInit(): void {
    this.initCytoscape();
  }

  private initCytoscape(): void {
    this.cy = cytoscape({
      container: document.getElementById('cy')!,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            shape: 'rectangle',
            width: 200,
            height: 50,
            padding: '12px',
            'background-color': '#f8f6f1',
            'border-width': 1,
            'border-color': '#8b8b8b',
            label: 'data(label)',
            'text-wrap': 'wrap',
            'white-space': 'normal',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-family': 'Arial, sans-serif',
            'font-size': '11px',
            'color': '#000'
          }
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#555',
            'curve-style': 'segments',
            'segment-distances': '20',
            'segment-weights': '0.25',
            'target-arrow-shape': 'none'
          } as any
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#ffe082',
            'line-color': '#ffa000',
            'transition-property': 'background-color, line-color',
            'transition-duration': '0.25s'
          }
        }
      ]
    });
  }

  loadDagTasks(): void {
    if (!this.selectedDagId) return;
    this.loading = true;

    this.airflowService.getDagTasks(this.selectedDagId).subscribe({
      next: (res: any) => {
        const tasks = res.tasks || [];

        const nodes = tasks.map((t: any) => ({
          data: {
            id: t.task_id,
            label: t.task_id,
            tooltip: `Task ID: ${t.task_id}\nOperator: ${t.operator_name || t.operator || 'N/A'}\nOwner: ${t.owner || 'N/A'}\nRetries: ${t.retries ?? 'N/A'}\nQueue: ${t.queue || 'default'}`
          }
        }));

        const edges = tasks.flatMap((t: any) =>
          (t.downstream_task_ids || []).map((target: string) => ({
            data: {
              source: t.task_id,
              target
            }
          }))
        );

        this.cy.elements().remove();
        this.cy.add([...nodes, ...edges]);

        this.cy.layout({
          name: 'elk',
          elk: {
            algorithm: 'layered',
            direction: 'RIGHT',
            spacing: 50,
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.layered.spacing.nodeNodeBetweenLayers': 60,
            'elk.layered.spacing.nodeNode': 30,
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF'
          }
        } as any).run();
        this.cy.on('tap', (event) => {
          if (event.target === this.cy) {
            this.cy.elements().removeClass('highlighted');
          }
        });
        this.cy.nodes().forEach((node) => {
          const tooltip = node.data('tooltip');
          const el = document.createElement('div');
          el.innerText = tooltip;
          el.style.position = 'absolute';
          el.style.padding = '4px 6px';
          el.style.background = '#222';
          el.style.color = '#fff';
          el.style.fontSize = '11px';
          el.style.borderRadius = '4px';
          el.style.pointerEvents = 'none';
          el.style.zIndex = '9999';
          el.style.display = 'none';
          el.style.whiteSpace = 'pre';
          document.body.appendChild(el);

          node.on('mouseover', () => {
            const pos = node.renderedPosition();
            const rect = this.cy.container()?.getBoundingClientRect();
            el.style.left = `${rect!.left + pos.x - el.offsetWidth - 12}px`;
            el.style.top = `${rect!.top + pos.y - el.offsetHeight / 2}px`;
            el.style.display = 'block';
          });

          node.on('mouseout', () => {
            el.style.display = 'none';
          });

          node.on('tap', () => {
            this.cy.elements().removeClass('highlighted');
            const successors = node.successors();
            const predecessors = node.predecessors();
            node.addClass('highlighted');
            successors.addClass('highlighted');
            predecessors.addClass('highlighted');
          });
        });

        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }
}