const ROLE_HELP: Record<string, string> = {
  Author: 'Wrote the content and signs to confirm it is their own work.',
  'Co-Author': 'Contributed alongside the author and signs to confirm their contribution.',
  Approver: 'Reviews the finished content and signs to approve it for release.',
  Observer: 'Follows the process and may sign to acknowledge it; signing is not required.',
  Reviewer: 'Checks the content for accuracy and signs to record the review.',
  Witness: 'Signs as an independent party to confirm the signing took place.',
  Editor: 'Edits or corrects the content and signs to confirm the changes.',
  Owner: 'Is accountable for the content and signs to take ownership of it.',
};

export function roleHelpText(role: string): string {
  return ROLE_HELP[role] ?? `${role}: signs to confirm their part in this content.`;
}
