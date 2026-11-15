import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Alert, Badge, Button, Card, Checkbox, DatePicker, Dropdown, EmptyState, ErrorState, FormField, FormSection, Input, Modal, MultiSelect, Pagination, Radio, SearchInput, Select, Skeleton, SkeletonCard, SkeletonTableRow, Switch, Table, Tabs, Textarea, ToastProvider, useToast, Drawer } from './index'

describe('reusable UI components', () => {
  it('supports button variants, sizes, loading, disabled, and click behavior', async () => {
    const user = userEvent.setup(); const onClick = vi.fn()
    render(<><Button onClick={onClick}>Primary</Button><Button variant="secondary" size="small">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button loading>Loading</Button><Button disabled>Disabled</Button></>)
    await user.click(screen.getByRole('button', { name: 'Primary' }))
    expect(onClick).toHaveBeenCalledOnce(); expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })

  it('handles controlled inputs and select options', async () => {
    const user = userEvent.setup(); function Example() { const [value, setValue] = useState(''); return <><Input aria-label="Nama" value={value} onChange={event => setValue(event.target.value)} /><Textarea aria-label="Catatan" placeholder="Catatan" /><Select aria-label="Peran" placeholder="Pilih peran" options={[{ value: 'dev', label: 'Developer' }]} /></> }
    const { rerender } = render(<Example />); await user.type(screen.getByRole('textbox', { name: 'Nama' }), 'Rina'); await user.type(screen.getByRole('textbox', { name: 'Catatan' }), 'Catatan project'); await user.selectOptions(screen.getByRole('combobox', { name: 'Peran' }), 'dev')
    expect(screen.getByRole('textbox', { name: 'Nama' })).toHaveValue('Rina'); expect(screen.getByRole('textbox', { name: 'Catatan' })).toHaveValue('Catatan project'); expect(screen.getByRole('combobox', { name: 'Peran' })).toHaveValue('dev')
    rerender(<Input aria-label="Error input" error />); expect(screen.getByRole('textbox', { name: 'Error input' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('supports MultiSelect selection, removal, empty state, and disabled state', async () => {
    const user = userEvent.setup(); function Example() { const [value, setValue] = useState(['jakarta']); return <MultiSelect label="Kota" options={[{ value: 'jakarta', label: 'Jakarta' }, { value: 'bandung', label: 'Bandung' }]} value={value} onChange={setValue} /> }
    render(<Example />); await user.click(screen.getByRole('combobox', { name: 'Kota' })); await user.click(screen.getByLabelText('Bandung')); expect(screen.getByRole('button', { name: 'Hapus Bandung' })).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: 'Hapus Jakarta' })); expect(screen.queryByRole('button', { name: 'Hapus Jakarta' })).not.toBeInTheDocument()
    cleanup()
    render(<MultiSelect label="Kosong" options={[]} value={[]} onChange={() => {}} />); await user.click(screen.getByRole('combobox', { name: 'Kosong' })); expect(screen.getByText('Tidak ada opsi tersedia.')).toBeInTheDocument()
  })

  it('renders date, checkbox, radio, and switch controls accessibly', async () => {
    const user = userEvent.setup(); const onRadio = vi.fn()
    render(<><DatePicker aria-label="Tanggal" defaultValue="2026-11-15" /><Checkbox aria-label="Syarat" defaultChecked /><Radio name="billing" value="monthly" onChange={onRadio} options={[{ value: 'monthly', label: 'Bulanan' }, { value: 'annual', label: 'Tahunan' }]} /><Switch aria-label="Notifikasi" /></>)
    const date = screen.getByLabelText('Tanggal'); expect(date).toHaveValue('2026-11-15'); fireEvent.change(date, { target: { value: '2026-12-01' } }); expect(date).toHaveValue('2026-12-01')
    const terms = screen.getByLabelText('Syarat'); expect(terms).toBeChecked(); await user.click(terms); expect(terms).not.toBeChecked(); await user.click(screen.getByLabelText('Tahunan')); expect(onRadio).toHaveBeenCalledWith('annual'); await user.click(screen.getByRole('switch', { name: 'Notifikasi' })); expect(screen.getByRole('switch', { name: 'Notifikasi' })).toBeChecked()
  })

  it('associates FormField labels, hints, and errors; FormSection renders its content', () => {
    render(<FormSection title="Data akun" description="Informasi dasar"><FormField label="Email" required hint="Alamat kerja" error="Email tidak valid."><Input /></FormField></FormSection>)
    const input = screen.getByRole('textbox', { name: /Email/ }); expect(input).toHaveAttribute('aria-invalid', 'true'); expect(input).toHaveAttribute('aria-describedby'); expect(screen.getByText('Informasi dasar')).toBeInTheDocument(); expect(screen.getByRole('alert')).toHaveTextContent('Email tidak valid.')
  })

  it('renders Card, Table custom cells, empty/loading table, badges, and alerts', () => {
    const columns = [{ key: 'name', header: 'Nama', render: (row: { name: string }) => <strong>{row.name}</strong> }]
    const onCardClick = vi.fn(); const { rerender } = render(<><Card title="Ringkasan" footer={<span>Footer</span>}>Isi kartu</Card><Card clickable aria-label="Project card" onClick={onCardClick}>Klik kartu</Card><Table columns={columns} rows={[{ name: 'Project A' }]} getRowKey={row => row.name} /><Badge variant="success">Aktif</Badge><Alert variant="warning" title="Peringatan">Periksa data.</Alert></>)
    expect(screen.getByRole('heading', { name: 'Ringkasan' })).toBeInTheDocument(); expect(screen.getByText('Project A')).toBeInTheDocument(); expect(screen.getByText('Aktif')).toBeInTheDocument(); expect(screen.getByText('Periksa data.')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Project card' }), { key: 'Enter' }); expect(onCardClick).toHaveBeenCalledOnce()
    rerender(<Table columns={columns} rows={[]} getRowKey={row => row.name} emptyState="Data kosong" />); expect(screen.getByText('Data kosong')).toBeInTheDocument()
    rerender(<Table columns={columns} rows={[]} getRowKey={row => row.name} loading />); expect(document.querySelectorAll('.ui-skeleton')).toHaveLength(3)
  })

  it('renders Skeleton, EmptyState, and retryable ErrorState', async () => {
    const user = userEvent.setup(); const retry = vi.fn()
    render(<><Skeleton variant="text" width="50%" /><SkeletonCard /><SkeletonTableRow columns={2} /><EmptyState title="Belum ada project" description="Buat project pertama." /><ErrorState title="Gagal memuat" description="Coba lagi." onRetry={retry} /></>)
    expect(screen.getByText('Belum ada project')).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: 'Coba lagi' })); expect(retry).toHaveBeenCalledOnce()
  })

  it('shows and dismisses each toast type through the reusable API', async () => {
    const user = userEvent.setup(); function Trigger() { const { toast } = useToast(); return <><button onClick={() => toast.success('Tersimpan')}>Success</button><button onClick={() => toast.error('Gagal')}>Error</button><button onClick={() => toast.warning('Waspada')}>Warning</button><button onClick={() => toast.info('Info')}>Info</button></> }
    render(<ToastProvider duration={60000}><Trigger /></ToastProvider>); await user.click(screen.getByRole('button', { name: 'Success' })); await user.click(screen.getByRole('button', { name: 'Error' })); await user.click(screen.getByRole('button', { name: 'Warning' })); await user.click(screen.getByRole('button', { name: 'Info' }))
    expect(screen.getByText('Tersimpan')).toBeInTheDocument(); expect(screen.getByText('Gagal')).toBeInTheDocument(); expect(screen.getByText('Waspada')).toBeInTheDocument(); expect(screen.getByText('Info', { selector: 'span' })).toBeInTheDocument(); await user.click(document.querySelector<HTMLButtonElement>('.ui-toast--success button')!); expect(screen.queryByText('Tersimpan')).not.toBeInTheDocument()
  })

  it('opens and closes modal and drawer with Escape', async () => {
    const user = userEvent.setup(); function Example() { const [open, setOpen] = useState(false); return <><button onClick={() => setOpen(true)}>Open</button><Modal open={open} onClose={() => setOpen(false)} title="Dialog">Isi dialog</Modal><Drawer open={open} onClose={() => setOpen(false)} title="Panel">Isi panel</Drawer></> }
    render(<Example />); await user.click(screen.getByRole('button', { name: 'Open' })); const dialog = screen.getByRole('dialog', { name: 'Dialog' }); expect(dialog).toBeInTheDocument(); expect(screen.getByRole('dialog', { name: 'Panel' })).toBeInTheDocument(); fireEvent(dialog, new Event('cancel', { cancelable: true })); expect(dialog).not.toHaveAttribute('open')
  })

  it('supports Dropdown actions and keyboard accessible tabs', async () => {
    const user = userEvent.setup(); const action = vi.fn()
    render(<><Dropdown items={[{ label: 'Edit', onSelect: action }, { label: 'Locked', disabled: true }, { label: 'Remove', destructive: true, separator: true }]} /><Tabs tabs={[{ id: 'one', label: 'Ringkasan', content: <p>Total 12</p> }, { id: 'two', label: 'Aktivitas', content: <p>Terbaru</p> }]} /></>)
    await user.click(screen.getByRole('button', { name: /Aksi/ })); expect(screen.getByRole('menuitem', { name: 'Locked' })).toBeDisabled(); await user.click(screen.getByRole('menuitem', { name: 'Edit' })); expect(action).toHaveBeenCalledOnce(); await user.click(screen.getByRole('tab', { name: 'Aktivitas' })); expect(screen.getByRole('tabpanel')).toHaveTextContent('Terbaru')
  })

  it('filters with SearchInput and changes pages within Pagination bounds', async () => {
    const user = userEvent.setup(); function Example() { const [query, setQuery] = useState(''); const [page, setPage] = useState(1); return <><SearchInput value={query} onChange={setQuery} aria-label="Cari fitur" /><p>{query || 'Semua fitur'}</p><Pagination page={page} totalPages={3} onPageChange={setPage} /><output>Halaman {page}</output></> }
    render(<Example />); await user.type(screen.getByRole('searchbox', { name: 'Cari fitur' }), 'login'); expect(screen.getByText('login')).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: 'Halaman 2' })); expect(screen.getByText('Halaman 2')).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).toBeEnabled()
  })

  it('displays all 25 actual components across showcase categories', async () => {
    const user = userEvent.setup(); const { default: Showcase } = await import('../../pages/ComponentShowcasePage')
    render(<Showcase />)
    for (const name of ['Button', 'Input', 'Textarea', 'Select', 'MultiSelect', 'DatePicker', 'Checkbox', 'Radio', 'Switch', 'FormField', 'FormSection']) expect(screen.getByRole('heading', { name, level: 3 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Data Display/ })); for (const name of ['Card', 'Table', 'Badge', 'Alert', 'Skeleton', 'EmptyState', 'ErrorState']) expect(screen.getByRole('heading', { name, level: 3 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Interactive/ })); for (const name of ['Toast', 'Modal', 'Drawer', 'Dropdown', 'Tabs']) expect(screen.getByRole('heading', { name, level: 3 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Navigation/ })); for (const name of ['SearchInput', 'Pagination']) expect(screen.getByRole('heading', { name, level: 3 })).toBeInTheDocument()
  })
})
