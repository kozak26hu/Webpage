import { useState } from 'react';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { Container, Typography, Box, Tabs, Tab, Chip } from '@mui/material';
import theme from './theme';
import WalletConnect from './components/WalletConnect';
import Staking from './components/Staking';
import Swap from './components/Swap';
import AddLiquidity from './components/AddLiquidity';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ mt: 3 }}>{children}</Box> : null;
}

// Animalt hatter: racs + lebego "orb"-ok, ugyanaz a hangulat, mint a honlapon
function BackgroundCanvas() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#060b18',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'gridMove 20s linear infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          top: -100,
          right: -100,
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.3,
          background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
          animation: 'orbFloat 12s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          bottom: 0,
          left: -50,
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.3,
          background: 'radial-gradient(circle, #7c3aed, transparent 70%)',
          animation: 'orbFloat 12s ease-in-out infinite -5s',
        }}
      />
    </Box>
  );
}

function App() {
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [tab, setTab] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          '@import': "url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap')",
          '@keyframes gridMove': { '0%': { transform: 'translate(0,0)' }, '100%': { transform: 'translate(40px,40px)' } },
          '@keyframes orbFloat': {
            '0%, 100%': { transform: 'translate(0,0) scale(1)' },
            '25%': { transform: 'translate(40px,-30px) scale(1.1)' },
            '50%': { transform: 'translate(-20px,20px) scale(0.9)' },
            '75%': { transform: 'translate(30px,40px) scale(1.05)' },
          },
          '@keyframes pulseRing': {
            '0%, 100%': { boxShadow: '0 0 0 0 rgba(59,130,246,0.4)' },
            '50%': { boxShadow: '0 0 0 12px rgba(59,130,246,0)' },
          },
        }}
      />
      <BackgroundCanvas />

      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {/* Hero */}
        <Box sx={{ textAlign: 'center', pt: 8, pb: 4, px: 2 }}>
          <Chip
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    animation: 'pulseRing 1.8s infinite',
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60a5fa' }}>
                  Ethereum Mainnet &middot; Live
                </Typography>
              </Box>
            }
            sx={{
              backgroundColor: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 100,
              px: 1,
              mb: 2,
              height: 32,
            }}
          />
          <Typography variant="h3" sx={{ fontSize: { xs: '2.4rem', md: '3.5rem' }, mb: 1 }}>
            PaperHands
          </Typography>
          <Typography sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto' }}>
            Swap, Stake, and Add Liquidity &mdash; all in one place.
          </Typography>
        </Box>

        <Container maxWidth="sm" sx={{ pb: 8 }}>
          <WalletConnect
            onConnect={(provider, signer) => {
              setProvider(provider);
              setSigner(signer);
            }}
          />

          {signer && provider && (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab label="Swap" />
                  <Tab label="Stake" />
                  <Tab label="Add Liquidity" />
                </Tabs>
              </Box>

              <TabPanel value={tab} index={0}>
                <Swap signer={signer} />
              </TabPanel>

              <TabPanel value={tab} index={1}>
                <Staking signer={signer} provider={provider} />
              </TabPanel>

              <TabPanel value={tab} index={2}>
                <AddLiquidity signer={signer} />
              </TabPanel>
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
