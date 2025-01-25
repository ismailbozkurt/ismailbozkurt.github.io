import React, { useEffect, useState } from 'react'
import { Box, ChakraProvider, Container, Text, Button, extendTheme, Flex, Image, HStack, VStack, Link } from '@chakra-ui/react'
import { remark } from 'remark'
import html from 'remark-html'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#040B14',
        color: 'white',
      },
      '.markdown-content': {
        h1: {
          fontSize: '2xl',
          fontWeight: 'bold',
          mb: 4,
          color: 'white',
        },
        h2: {
          fontSize: 'xl',
          fontWeight: 'bold',
          mb: 3,
          mt: 6,
          color: 'white',
        },
        h3: {
          fontSize: 'lg',
          fontWeight: 'bold',
          mb: 2,
          mt: 4,
          color: 'white',
        },
        p: {
          mb: 4,
          lineHeight: 'tall',
        },
        ul: {
          ml: 4,
          mb: 4,
        },
        li: {
          mb: 1,
        },
        code: {
          bg: 'rgba(0, 0, 0, 0.3)',
          p: 1,
          borderRadius: 'sm',
          fontFamily: 'mono',
        },
        'pre code': {
          display: 'block',
          overflow: 'auto',
          p: 4,
          bg: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(22, 101, 216, 0.3)',
          borderRadius: '0',
          color: 'whiteAlpha.900',
        }
      }
    },
  },
})

const LogoIcon = () => (
  <Image
    src="neon-geometric.webp"
    alt="Geometric Logo"
    width="40px"
    height="40px"
    objectFit="contain"
  />
)

const Header = () => (
  <Box 
    position="fixed" 
    top={0} 
    left={0} 
    right={0} 
    zIndex={10}
    bg="rgba(4, 11, 20, 0.65)"
    backdropFilter="blur(8px)"
    borderBottom="1px solid rgba(22, 101, 216, 0.15)"
    boxShadow="0 4px 30px rgba(0, 0, 0, 0.1)"
  >
    <Container maxW="container.xl" py={4}>
      <Flex justify="space-between" align="center">
        {/* Logo */}
        <HStack spacing={3}>
          <LogoIcon />
          <Text 
            fontSize="lg" 
            fontWeight="bold" 
            letterSpacing="wide"
            bgGradient="linear(to-r, white, whiteAlpha.900)"
            bgClip="text"
          >
            İSMAİL BOZKURT
          </Text>
        </HStack>

        {/* Login Button - Commented out for future reference
        <HStack spacing={3}>
          <Button
            bg="rgba(4, 11, 20, 0.95)"
            color="white"
            border="1px solid rgba(22, 101, 216, 0.3)"
            _hover={{ 
              bg: 'rgba(22, 101, 216, 0.15)',
              boxShadow: '0 0 10px rgba(22, 101, 216, 0.3)'
            }}
            size="sm"
            px={4}
            height="34px"
            fontSize="13px"
            fontWeight="500"
            borderRadius="0"
            leftIcon={
              <Box as="span" fontSize="1.1em">
                →
              </Box>
            }
          >
            Log In
          </Button>
        </HStack>
        */}
      </Flex>
    </Container>
  </Box>
)

const CircuitBackground = () => (
  <Box 
    position="fixed" 
    inset={0} 
    pointerEvents="none" 
    overflow="hidden"
    zIndex={1}
  >
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
      {/* Left Side Main Circuit */}
      <path
        d="M 0,100 L 150,100 L 150,250 L 300,250 L 300,400 
           M 150,100 L 150,50 L 250,50 L 250,150 L 350,150
           M 0,300 L 100,300 L 100,450 L 200,450 L 200,600
           M 100,300 L 100,200 L 200,200 L 200,350"
        stroke="rgba(22, 101, 216, 0.45)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Left Side Secondary Circuit */}
      <path
        d="M 50,0 L 50,150 L 120,150 L 120,280
           M 0,200 L 80,200 L 80,350 L 160,350 L 160,500
           M 80,350 L 180,350 L 180,250"
        stroke="rgba(22, 101, 216, 0.35)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Right Side Main Circuit */}
      <path
        d="M 1920,100 L 1770,100 L 1770,250 L 1620,250 L 1620,400
           M 1770,100 L 1770,50 L 1670,50 L 1670,150 L 1570,150
           M 1920,300 L 1820,300 L 1820,450 L 1720,450 L 1720,600
           M 1820,300 L 1820,200 L 1720,200 L 1720,350"
        stroke="rgba(22, 101, 216, 0.45)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Right Side Secondary Circuit */}
      <path
        d="M 1870,0 L 1870,150 L 1800,150 L 1800,280
           M 1920,200 L 1840,200 L 1840,350 L 1760,350 L 1760,500
           M 1840,350 L 1740,350 L 1740,250"
        stroke="rgba(22, 101, 216, 0.35)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Circuit Nodes */}
      {[
        [150, 100], [250, 150], [100, 300], [200, 350], [120, 280], [180, 250],
        [1770, 100], [1670, 150], [1820, 300], [1720, 350], [1800, 280], [1740, 250]
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="2.5"
          fill="rgba(22, 101, 216, 0.65)"
        />
      ))}

      {/* Vertical Connection Lines */}
      <path
        d="M 50,0 L 50,1080 M 1870,0 L 1870,1080"
        stroke="rgba(22, 101, 216, 0.25)"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  </Box>
)

interface ContentItem {
  name: string;
  path: string;
}

interface Section {
  title: string;
  items: ContentItem[];
}

const getGitHubRawUrl = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `https://raw.githubusercontent.com/ismailbozkurt/ismailbozkurt.github.io/main/${cleanPath}`;
};

const Sidebar = ({ onFileSelect }: { onFileSelect: (path: string) => void }) => {
  const sections: Section[] = [
    {
      title: "INTRO",
      items: [
        {
          name: "About Me",
          path: "Content/Intro/About-me.md"
        }
      ]
    },
    {
      title: "CODE PIECES",
      items: [
        {
          name: "Sample",
          path: "Content/Code Pieces/sample.md"
        }
      ]
    },
    {
      title: "VULNERABILITY RESEARCH",
      items: [
        {
          name: "Research Methodology",
          path: "Content/Vulnerability Research/deneme.md"
        }
      ]
    }
  ];

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      w="280px"
      bg="rgba(4, 11, 20, 0.85)"
      borderRight="1px solid rgba(22, 101, 216, 0.3)"
      backdropFilter="blur(16px)"
      overflowY="auto"
      zIndex={5}
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.05)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(22, 101, 216, 0.15)',
          borderRadius: '2px',
        },
      }}
      pt="80px"
    >
      <VStack align="stretch" spacing={6} p={4}>
        {sections.map((section, index) => (
          <Box key={index}>
            <Text 
              color="rgba(22, 101, 216, 0.8)" 
              fontSize="sm" 
              mb={3}
              fontWeight="500"
              letterSpacing="0.5px"
            >
              {section.title}
            </Text>
            <VStack align="stretch" spacing={2}>
              {section.items.map((item, itemIndex) => (
                <Link
                  key={itemIndex}
                  as="button"
                  color="white"
                  fontSize="13px"
                  cursor="pointer"
                  textAlign="left"
                  display="block"
                  width="100%"
                  px={3}
                  py={1.5}
                  bg="rgba(4, 11, 20, 0.95)"
                  border="1px solid rgba(22, 101, 216, 0.3)"
                  borderRadius="0"
                  transition="all 0.2s"
                  _hover={{ 
                    bg: 'rgba(22, 101, 216, 0.15)',
                    boxShadow: '0 0 10px rgba(22, 101, 216, 0.3)',
                    textDecoration: 'none',
                    color: 'white'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    onFileSelect(item.path);
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

const ContentViewer = ({ filePath }: { filePath: string }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Convert the local path to GitHub raw URL
        const githubRawUrl = `https://raw.githubusercontent.com/ismailbozkurt/ismailbozkurt.github.io/main/${filePath}`;
        console.log('Fetching from:', githubRawUrl); // Debug log
        const response = await fetch(githubRawUrl);
        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.statusText}`);
        }
        const text = await response.text();
        console.log('Fetched content:', text); // Debug log
        
        // Process markdown content
        const processedContent = await remark()
          .use(html, { sanitize: false }) // Disable sanitization to allow img tags with styles
          .process(text);
          
        setContent(processedContent.toString());
        setError(null);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content');
      }
    };

    if (filePath) {
      fetchContent();
    }
  }, [filePath]);

  if (error) {
    return (
      <Box p={4} color="red.500">
        {error}
      </Box>
    );
  }

  return (
    <Box 
      p={6} 
      bg="rgba(4, 11, 20, 0.25)"
      backdropFilter="blur(16px)"
      borderRadius="md"
      border="1px solid rgba(22, 101, 216, 0.15)"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 'md',
        border: '1px solid',
        borderColor: 'rgba(22, 101, 216, 0.4)',
        opacity: 0.5,
        pointerEvents: 'none'
      }}
    >
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </Box>
  );
};

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('Content/Intro/About-me.md');

  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
  };

  return (
    <ChakraProvider theme={theme}>
      {/* Circuit Background - Moved outside the main Box */}
      <CircuitBackground />
      
      <Box position="relative" minH="100vh" overflow="hidden" bg="#040B14">
        {/* Header */}
        <Header />

        {/* Sidebar */}
        <Sidebar onFileSelect={handleFileSelect} />

        {/* Content - Adjust margin to account for sidebar */}
        <Box ml="280px">
          <Container maxW="container.lg" py={32} position="relative" zIndex={2}>
            <ContentViewer filePath={selectedFile} />
          </Container>
        </Box>
      </Box>
    </ChakraProvider>
  )
}

export default App
