import * as React from 'react';
import {
  Button,
  Input,
  Select,
  Form,
  FormField,
  FormLabel,
  FormMessage,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalTrigger,
  toast,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../ui';

export function UIComponentsDemo() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    role: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.role) newErrors.role = 'Role is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      toast({
        title: 'Success!',
        description: 'Form submitted successfully.',
        variant: 'success',
      });
      setIsModalOpen(false);
    }
  };

  const showToastExamples = () => {
    toast({
      title: 'Info Toast',
      description: 'This is an informational message.',
      variant: 'info',
    });

    setTimeout(() => {
      toast({
        title: 'Warning Toast',
        description: 'This is a warning message.',
        variant: 'warning',
      });
    }, 1000);

    setTimeout(() => {
      toast({
        title: 'Error Toast',
        description: 'This is an error message.',
        variant: 'destructive',
      });
    }, 2000);
  };

  return (
    <div className='space-y-8 p-8'>
      <Card>
        <CardHeader>
          <CardTitle>UI Components Demo</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Button Examples */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Buttons</h3>
            <div className='flex flex-wrap gap-2'>
              <Button variant='default'>Default</Button>
              <Button variant='secondary'>Secondary</Button>
              <Button variant='destructive'>Destructive</Button>
              <Button variant='outline'>Outline</Button>
              <Button variant='ghost'>Ghost</Button>
              <Button variant='link'>Link</Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button size='sm'>Small</Button>
              <Button size='default'>Default</Button>
              <Button size='lg'>Large</Button>
              <Button size='icon'>🔥</Button>
            </div>
          </div>

          {/* Input Examples */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Inputs</h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Input placeholder='Default input' />
              <Input placeholder='Success input' variant='success' />
              <Input placeholder='Error input' variant='error' error='This field has an error' />
              <Input placeholder='With helper text' helperText='This is helper text' />
            </div>
          </div>

          {/* Select Examples */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Select</h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Select placeholder='Choose an option'>
                <option value='option1'>Option 1</option>
                <option value='option2'>Option 2</option>
                <option value='option3'>Option 3</option>
              </Select>
              <Select placeholder='With error' error='Please select an option'>
                <option value='option1'>Option 1</option>
                <option value='option2'>Option 2</option>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Interactive Examples</h3>
            <div className='flex flex-wrap gap-4'>
              <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalTrigger asChild>
                  <Button>Open Modal</Button>
                </ModalTrigger>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>Example Form</ModalTitle>
                    <ModalDescription>
                      Fill out this form to see validation in action.
                    </ModalDescription>
                  </ModalHeader>
                  <Form onSubmit={handleSubmit} errors={errors}>
                    <FormField name='name'>
                      <FormLabel required>Name</FormLabel>
                      <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder='Enter your name'
                        error={errors.name}
                      />
                      <FormMessage>{errors.name}</FormMessage>
                    </FormField>

                    <FormField name='email'>
                      <FormLabel required>Email</FormLabel>
                      <Input
                        type='email'
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder='Enter your email'
                        error={errors.email}
                      />
                      <FormMessage>{errors.email}</FormMessage>
                    </FormField>

                    <FormField name='role'>
                      <FormLabel required>Role</FormLabel>
                      <Select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        placeholder='Select your role'
                        error={errors.role}
                      >
                        <option value='developer'>Developer</option>
                        <option value='designer'>Designer</option>
                        <option value='manager'>Manager</option>
                        <option value='qa'>QA Engineer</option>
                      </Select>
                      <FormMessage>{errors.role}</FormMessage>
                    </FormField>

                    <ModalFooter>
                      <Button type='button' variant='outline' onClick={() => setIsModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type='submit'>Submit</Button>
                    </ModalFooter>
                  </Form>
                </ModalContent>
              </Modal>

              <Button onClick={showToastExamples}>Show Toast Examples</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
