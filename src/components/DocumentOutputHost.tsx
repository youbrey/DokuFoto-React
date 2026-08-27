import React from 'react';
import type { DocumentProject } from '../types';
import { getOutputPageElementId } from '../utils/pageRender';
import { DocumentPageView } from './DocumentPageView';

export const DocumentOutputHost: React.FC<{ project: DocumentProject }> = ({ project }) => (
  <div
    aria-hidden="true"
    data-dokufoto-output-host
    style={{
      position: 'fixed',
      left: '-100000px',
      top: 0,
      pointerEvents: 'none',
      zIndex: -1,
    }}
  >
    {project.pages.map((page) => (
      <DocumentPageView
        key={page.id}
        id={getOutputPageElementId(page.id)}
        project={project}
        page={page}
      />
    ))}
  </div>
);
