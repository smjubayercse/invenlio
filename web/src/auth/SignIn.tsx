import { Alert, Button, Text, Title } from "@mantine/core";
import {
  IconArrowRight,
  IconBox,
  IconLock,
  IconTruck,
  IconBuildingWarehouse,
} from "@tabler/icons-react";

type SignInProps = { login: () => void; error?: string };

export function SignIn({ login, error }: SignInProps) {
  return (
    <main className="signin">
      <section className="signin-story" aria-labelledby="signin-story-title">
        <a className="signin-brand" href="/" aria-label="Invenlio home">
          <span className="signin-mark">
            <IconBox size={24} />
          </span>
          invenlio<span className="signin-dot">.</span>
        </a>
        <div className="signin-story-content">
          <span className="signin-eyebrow">YOUR OPERATIONS, CONNECTED</span>
          <h1 id="signin-story-title">
            Every order.
            <br />
            Every movement.
            <br />
            <span>One workspace.</span>
          </h1>
          <p>
            Bring inventory, purchasing and fulfillment together. Keep your team
            moving from the first delivery to the final shipment.
          </p>
          <div className="signin-capabilities">
            <span>
              <IconBox size={19} /> Inventory
            </span>
            <span>
              <IconBuildingWarehouse size={19} /> Warehousing
            </span>
            <span>
              <IconTruck size={19} /> Fulfillment
            </span>
          </div>
        </div>
        <div className="signin-story-footer">
          Clarity at every step of your operation.
        </div>
      </section>
      <section className="signin-access" aria-labelledby="signin-title">
        <div className="signin-card">
          <span className="signin-lock">
            <IconLock size={25} />
          </span>
          <Text className="signin-eyebrow" c="dimmed" mt="xl">
            YOUR WORKSPACE AWAITS
          </Text>
          <Title id="signin-title" order={2} className="signin-title">
            Welcome back
          </Title>
          <Text c="dimmed" size="md" mb="xl">
            Sign in to manage your operations.
          </Text>
          {error && (
            <Alert color="red" role="alert" mb="lg">
              {error}
            </Alert>
          )}
          <Button
            fullWidth
            size="lg"
            radius="md"
            onClick={login}
            rightSection={<IconArrowRight size={19} />}
          >
            Sign in
          </Button>
          <Text size="sm" c="dimmed" mt="lg" ta="center">
            Continue to your organization’s sign-in page.
          </Text>
          <div className="signin-help">
            <Text size="sm" fw={600}>
              Need access?
            </Text>
            <Text size="sm" c="dimmed">
              Contact your organization administrator.
            </Text>
          </div>
        </div>
        <Text className="signin-access-footer" size="xs" c="dimmed">
          Invenlio · Inventory &amp; order management
        </Text>
      </section>
    </main>
  );
}
