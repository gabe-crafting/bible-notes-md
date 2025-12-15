import { Mark, mergeAttributes } from '@tiptap/core';

export interface VerseReferenceOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    verseReference: {
      /**
       * Set a verse reference mark
       */
      setVerseReference: (attributes: { reference: string }) => ReturnType;
      /**
       * Remove verse reference mark
       */
      unsetVerseReference: () => ReturnType;
    };
  }
}

export const VerseReference = Mark.create<VerseReferenceOptions>({
  name: 'verseReference',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      reference: {
        default: null,
        parseHTML: element => element.getAttribute('data-reference'),
        renderHTML: attributes => {
          if (!attributes.reference) {
            return {};
          }
          return {
            'data-reference': attributes.reference,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="verse-reference"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, this.options.HTMLAttributes, {
        'data-type': 'verse-reference',
        class: 'verse-reference cursor-pointer text-primary underline hover:text-primary/80',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setVerseReference:
        attributes =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetVerseReference:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

