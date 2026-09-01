import { OptiFormsContainerContentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
import {
  FormSubmissionProvider,
  FormStep,
  FormWrapper,
  getFormButtonRole,
  isFormButtonNode,
  partitionFormNodes,
} from '@optimizely/cms-sdk/forms/react';
import { cn } from '../../lib/utils';
import FormAlerts from './FormAlerts';
import FormStepTracker from './FormStepTracker';
import { GridColumn, GridRow } from './Grid';

type FormContainerProps = {
  content: OptiFormsContainerContentType;
};

type Node = NonNullable<OptiFormsContainerContentType['nodes']>[number];

/**
 * Footer holding a step's buttons: back on the left, forward on the right.
 * Alignment is done here, not via `ml-auto` on the button, since in edit mode
 * the CMS marker div around each button would swallow that margin.
 */
function FormActions({ nodes }: { nodes: Node[] }) {
  const goesBack = (node: Node) =>
    getFormButtonRole(
      (node as { component?: { Label?: string | null } }).component ?? {},
    ) === 'previous';

  return (
    <div
      className={cn(
        'mt-6 flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-5',
        nodes.some(goesBack) ? 'justify-between' : 'justify-end',
      )}
    >
      <OptimizelyGridSection nodes={nodes} row={GridRow} column={GridColumn} />
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
      <div id='form-alert' className='max-w-2xl space-y-5'>
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

        <FormWrapper
          scrollToOnSuccess='form-alert'
          scrollToOnError={false}
          action={content.SubmitUrl?.default ?? ''}
          steps={stepNodes}
          rules={content.DependencyRules}
        >
          <div className='card space-y-6 p-6 sm:p-8'>
            <FormStepTracker steps={stepNodes.length} />

            {stepNodes.map((node, index) => {
              // Hoisted into a footer in every mode, so the form looks the same
              // while editing as it does to a visitor. Each button keeps its own
              // block marker; the row and column that held it are dropped, so
              // those two nodes are not selectable in the CMS.
              const step = partitionFormNodes([node]);

              return (
                <FormStep key={node.key} index={index} node={node as { key: string }}>
                  <OptimizelyGridSection
                    nodes={step.content}
                    row={GridRow}
                    column={GridColumn}
                  />
                  {step.buttons.length > 0 && <FormActions nodes={step.buttons} />}
                </FormStep>
              );
            })}

            {buttonNodes.length > 0 && <FormActions nodes={buttonNodes} />}
          </div>
        </FormWrapper>
      </div>
    </FormSubmissionProvider>
  );
}
