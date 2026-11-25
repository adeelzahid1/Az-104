/** Closes a dialog when its backdrop, not its content, was clicked. */
export function closeOnBackdrop(event: MouseEvent, dialog: HTMLDialogElement): void {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  const inside =
    event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
  if (!inside) dialog.close();
}
