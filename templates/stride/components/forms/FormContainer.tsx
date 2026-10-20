import { OptiFormsContainerContentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
import {
  FormSubmissionProvider,
  FormStep,
  getFormButtonRole,
  isFormButtonNode,
} from '@optimizely/cms-sdk/forms/react';
import FormContainerClient from './FormContainerClient';
import { cn } from '../../lib/utils';
import FormAlerts from './FormAlerts';
import FormStepTracker from './FormStepTracker';
import FormStepNavigation from './FormStepNavigation';
import { GridColumn, GridRow } from './Grid';

type FormContainerProps = {
  content: OptiFormsContainerContentType;
};

type Node = NonNullable<OptiFormsContainerContentType['nodes']>[number];

const FORM_ACTION_TYPES = new Set(['OptiFormsSubmitElement', 'OptiFormsResetElement']);

function isFormActionNode(node: Node): boolean {
  return (
    node.nodeType === 'component' &&
    FORM_ACTION_TYPES.has(
      (node as { component?: { __typename?: string } }).component?.__typename ?? '',
    )
  );
}

function partitionStepNodes(nodes: Node[]): { content: Node[]; buttons: Node[] } {
  const content: Node[] = [];
  const buttons: Node[] = [];

  for (const node of nodes) {
    const childNodes = 'nodes' in node ? (node as { nodes?: Node[] }).nodes : undefined;

    if (isFormActionNode(node)) {
      buttons.push(node);
    } else if (Array.isArray(childNodes)) {
      const inner = partitionStepNodes(childNodes);
      buttons.push(...inner.buttons);
      if (inner.content.length > 0) content.push({ ...node, nodes: inner.content } as Node);
    } else {
      content.push(node);
    }
  }

  return { content, buttons };
}

/**
 * Footer holding a step's buttons: back on the left, forward on the right.
 * Alignment is done here, not via `ml-auto` on the button, since in edit mode
 * the CMS marker div around each button would swallow that margin.
 */
function FormActions({
  nodes,
  children,
}: {
  nodes: Node[];
  children?: React.ReactNode;
}) {
  const goesStart = (node: Node) => {
    const comp =
      (node as { component?: { __typename?: string; Label?: string | null } }).component ?? {};
    return (
      getFormButtonRole(comp) === 'previous' ||
      comp.__typename === 'OptiFormsResetElement'
    );
  };

  return (
    <div
      className={cn(
        'mt-6 flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-5',
        nodes.some(goesStart) ? 'justify-between' : 'justify-end',
      )}
    >
      <OptimizelyGridSection nodes={nodes} row={GridRow} column={GridColumn} />
      {children}
    </div>
  );
}

export default function FormContainer({ content }: FormContainerProps) {
  const { pa } = getPreviewUtils(content);
  const nodes = (content.nodes ?? []) as Node[];
  const buttonNodes = nodes.filter(isFormButtonNode);
  const stepNodes = nodes.filter(node => !isFormButtonNode(node));

  if (process.env.NODE_ENV !== 'production' && nodes.length === 0) {
    console.warn(
      `Form "${content.Title ?? content._metadata?.key}" rendered with no nodes.`,
    );
  }

  return (
    <FormSubmissionProvider>
      {/* Forms read better narrow. Long lines make a field look like a text block. */}
      <div id='form-alert' className='container mx-auto space-y-5'>
        <div className='space-y-2'>
          {/* `h2`, not `h1` — the form is a block on a page that already has a heading. */}
          {content.Title && (
            <h2
              {...pa('Title')}
              className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'
            >
              {content.Title}
            </h2>
          )}
          {content.Description && (
            <p {...pa('Description')} className='text-base leading-relaxed text-foreground2'>
              {content.Description}
            </p>
          )}
        </div>

        <FormAlerts
          submitConfirmationMessage={content.SubmitConfirmationMessage ?? null}
        />

        <FormContainerClient
          scrollToOnSuccess='form-alert'
          scrollToOnError={false}
          action={content.SubmitUrl?.default ?? ''}
          steps={stepNodes}
          rules={content.DependencyRules}
        >
          <div className='card space-y-6 p-6 sm:p-8'>
            <FormStepTracker steps={stepNodes.length} />

            {stepNodes.map((node, index) => {
              const step = partitionStepNodes([node]);

              const isNavButton = (btn: Node) => {
                const comp =
                  (btn as { component?: { __typename?: string; Label?: string | null } })
                    .component ?? {};
                if (comp.__typename === 'OptiFormsResetElement') return true;
                const role = getFormButtonRole(comp);
                return role === 'previous' || role === 'next';
              };

              const navButtons = step.buttons.filter(isNavButton);
              const actionButtons = step.buttons.filter(btn => !isNavButton(btn));
              const excludeRoles = step.buttons.map(btn =>
                getFormButtonRole(
                  (btn as { component?: { Label?: string | null } }).component ?? {},
                ),
              );

              return (
                <FormStep key={node.key} index={index} node={node as { key: string }}>
                  <OptimizelyGridSection
                    nodes={step.content}
                    row={GridRow}
                    column={GridColumn}
                  />
                  {navButtons.length > 0 ? (
                    <FormActions nodes={navButtons}>
                      <FormStepNavigation
                        totalSteps={stepNodes.length}
                        excludeRoles={excludeRoles}
                        bare
                      />
                    </FormActions>
                  ) : (
                    <FormStepNavigation
                      totalSteps={stepNodes.length}
                      excludeRoles={excludeRoles}
                    />
                  )}
                  {actionButtons.length > 0 && <FormActions nodes={actionButtons} />}
                </FormStep>
              );
            })}

            {buttonNodes.length > 0 && <FormActions nodes={buttonNodes} />}
          </div>
        </FormContainerClient>
      </div>
    </FormSubmissionProvider>
  );
}
