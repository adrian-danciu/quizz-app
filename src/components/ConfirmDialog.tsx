import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent><Typography color="text.secondary">{props.description}</Typography></DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={props.onClose}>Rămân în sesiune</Button>
        <Button color="error" variant="contained" onClick={props.onConfirm}>{props.confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  )
}
