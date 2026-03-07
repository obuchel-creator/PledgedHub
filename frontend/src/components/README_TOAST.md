# Toast Notification Component

## Usage

### Basic Import

```jsx
import Toast from '../components/Toast';
```

### Example with State

```jsx
const [toast, setToast] = useState(null);

// Show success toast
setToast({ message: 'Pledge created successfully!', type: 'success' });

// Show error toast
setToast({ message: 'Failed to save pledge', type: 'error' });

// Show warning toast
setToast({ message: 'Please complete all required fields', type: 'warning' });

// Show info toast
setToast({ message: 'Your session will expire in 5 minutes', type: 'info' });

// Render in component
{
  toast && (
    <Toast
      message={toast.message}
      type={toast.type}
      duration={4000}
      onClose={() => setToast(null)}
    />
  );
}
```

### Props

| Prop       | Type     | Default    | Description                                                  |
| ---------- | -------- | ---------- | ------------------------------------------------------------ |
| `message`  | string   | (required) | The message to display in the toast                          |
| `type`     | string   | `'info'`   | Toast type: `'success'`, `'error'`, `'warning'`, or `'info'` |
| `duration` | number   | `4000`     | How long to show the toast (milliseconds)                    |
| `onClose`  | function | -          | Callback when toast is closed                                |

### Type Styles

- **Success** (green): ✓ icon, for successful operations
- **Error** (red): ✕ icon, for errors and failures
- **Warning** (orange): ⚠ icon, for warnings and alerts
- **Info** (blue): ℹ icon, for informational messages

### Features

- ✨ Auto-dismisses after specified duration
- ✨ Manual close button
- ✨ Smooth slide-in/slide-out animations
- ✨ Mobile responsive
- ✨ Beautiful gradient backgrounds
- ✨ Backdrop blur effect
- ✨ Accessible (ARIA role="alert")

### Real-World Example

```jsx
import React, { useState } from 'react';
import Toast from '../components/Toast';
import { createPledge } from '../services/api';

export default function CreatePledgeForm() {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await createPledge(formData);
      setToast({
        message: 'Pledge created successfully! 🎉',
        type: 'success',
      });
    } catch (error) {
      setToast({
        message: error.message || 'Failed to create pledge',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your form here */}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
```

### Multiple Toasts

If you need to show multiple toasts at once, create a toast queue:

```jsx
const [toasts, setToasts] = useState([]);

const addToast = (message, type = 'info') => {
  const id = Date.now();
  setToasts((prev) => [...prev, { id, message, type }]);
};

const removeToast = (id) => {
  setToasts((prev) => prev.filter((t) => t.id !== id));
};

// Render
<div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999 }}>
  {toasts.map((toast, index) => (
    <div key={toast.id} style={{ marginBottom: '1rem' }}>
      <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
    </div>
  ))}
</div>;
```

### Custom Duration

```jsx
// Show for 2 seconds
<Toast message="Quick message" type="info" duration={2000} />

// Show for 10 seconds
<Toast message="Important message" type="warning" duration={10000} />
```

### Accessibility

The Toast component includes:

- `role="alert"` for screen readers
- `aria-label` on close button
- Keyboard accessible close button
- Proper color contrast

### Mobile Behavior

On screens smaller than 480px:

- Toast spans full width with margins
- Maintains touch-friendly close button
- Animations remain smooth

