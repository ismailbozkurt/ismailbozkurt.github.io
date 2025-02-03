import React, { useEffect, useState } from 'react'
import { Box, ChakraProvider, Container, Text, extendTheme, Flex, Image, HStack, VStack, Link } from '@chakra-ui/react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { config } from './config/env'
import { Certifications } from './components/Certifications'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#040B14',
        color: 'rgba(255, 255, 255, 0.7)',
      },
      '.markdown-content': {
        h1: {
          fontSize: '2xl',
          fontWeight: 'bold',
          mb: 4,
          color: 'rgba(255, 255, 255, 0.8)',
        },
        h2: {
          fontSize: 'xl',
          fontWeight: 'bold',
          mb: 3,
          mt: 6,
          color: 'rgba(255, 255, 255, 0.8)',
        },
        h3: {
          fontSize: 'lg',
          fontWeight: 'bold',
          mb: 2,
          mt: 4,
          color: 'rgba(255, 255, 255, 0.8)',
        },
        p: {
          mb: 4,
          lineHeight: 'tall',
          color: 'rgba(255, 255, 255, 0.7)',
        },
        ul: {
          ml: 4,
          mb: 4,
          color: 'rgba(255, 255, 255, 0.7)',
        },
        li: {
          mb: 1,
          color: 'rgba(255, 255, 255, 0.7)',
        },
        code: {
          bg: 'rgba(0, 0, 0, 0.3)',
          p: 1,
          borderRadius: 'sm',
          fontFamily: 'mono',
          color: 'rgba(255, 255, 255, 0.7)',
        },
        'pre code': {
          display: 'block',
          overflow: 'auto',
          p: 4,
          bg: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(22, 101, 216, 0.3)',
          borderRadius: '0',
          color: 'rgba(255, 255, 255, 0.7)',
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
      <path
        d="M 0,100 L 150,100 L 150,250 L 300,250 L 300,400 
           M 150,100 L 150,50 L 250,50 L 250,150 L 350,150
           M 0,300 L 100,300 L 100,450 L 200,450 L 200,600
           M 100,300 L 100,200 L 200,200 L 200,350"
        stroke="rgba(22, 101, 216, 0.45)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M 50,0 L 50,150 L 120,150 L 120,280
           M 0,200 L 80,200 L 80,350 L 160,350 L 160,500
           M 80,350 L 180,350 L 180,250"
        stroke="rgba(22, 101, 216, 0.35)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M 1920,100 L 1770,100 L 1770,250 L 1620,250 L 1620,400
           M 1770,100 L 1770,50 L 1670,50 L 1670,150 L 1570,150
           M 1920,300 L 1820,300 L 1820,450 L 1720,450 L 1720,600
           M 1820,300 L 1820,200 L 1720,200 L 1720,350"
        stroke="rgba(22, 101, 216, 0.45)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M 1870,0 L 1870,150 L 1800,150 L 1800,280
           M 1920,200 L 1840,200 L 1840,350 L 1760,350 L 1760,500
           M 1840,350 L 1740,350 L 1740,250"
        stroke="rgba(22, 101, 216, 0.35)"
        strokeWidth="1.5"
        fill="none"
      />
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

const getContentUrl = (path: string) => {
  if (config.isProd) {
    // GitHub raw content URL for production
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${config.contentBaseUrl}/${cleanPath}`;
  } else {
    // Local API server URL for development
    return `${config.apiBaseUrl}/api/file?path=${encodeURIComponent(path)}`;
  }
};

const Sidebar = ({ onFileSelect }: { onFileSelect: (path: string) => void }) => {
  const [selectedPath, setSelectedPath] = useState<string>('Content/Intro/About-me.md');
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
    },
    {
      title: "NOTES2MYSELF",
      items: [
        {
          name: "Notes2Myself",
          path: "Content/Notes2Myself/Notes2Myself.md"
        }
      ]
    },
    {
      title: "HowThingsGetComplicated",
      items: [
        {
          name: "HowThingsGetComplicated",
          path: "Content/HowThingsGetComplicated/HowThingsGetComplicated-1.md"
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
              color="white" 
              fontSize="sm" 
              mb={3}
              fontWeight="500"
              letterSpacing="0.5px"
            >
              {section.title}
            </Text>
            <VStack align="stretch" spacing={2}>
              {section.items.map((item, itemIndex) => {
                const isSelected = selectedPath === item.path;
                return (
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
                    bg={isSelected ? 'rgba(22, 101, 216, 0.25)' : 'transparent'}
                    border="none"
                    outline="none"
                    borderRadius="0"
                    transition="all 0.3s ease"
                    textShadow={isSelected ? '0 0 10px rgba(255, 255, 255, 0.6)' : 'none'}
                    boxShadow={isSelected ? '0 0 15px rgba(22, 101, 216, 0.4) inset' : 'none'}
                    _hover={{ 
                      bg: 'rgba(22, 101, 216, 0.15)',
                      boxShadow: '0 0 10px rgba(22, 101, 216, 0.3)',
                      textDecoration: 'none',
                      color: 'white',
                      textShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
                      border: 'none'
                    }}
                    _active={{
                      bg: 'rgba(22, 101, 216, 0.25)',
                      boxShadow: '0 0 15px rgba(22, 101, 216, 0.4) inset',
                      transform: 'scale(0.98)',
                      color: 'white',
                      textShadow: '0 0 12px rgba(255, 255, 255, 0.6)',
                      border: 'none'
                    }}
                    _focus={{
                      border: 'none',
                      outline: 'none'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedPath(item.path);
                      onFileSelect(item.path);
                    }}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

const ContentViewer = ({ filePath }: { filePath: string }) => {
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const url = getContentUrl(filePath);
        console.log(`Fetching content from ${config.isProd ? 'GitHub' : 'local server'}:`, url);
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status}`)
        }
        const text = await response.text()
        
        const processContent = async (text: string) => {
          if (!text) return ''
          const processed = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype, { allowDangerousHtml: true })
            .use(rehypeStringify, { allowDangerousHtml: true })
            .process(text)
          return String(processed)
        }

        // Check if this is the About-me.md file
        if (filePath === 'Content/Intro/About-me.md') {
          // Split content for About-me.md
          const [beforeCert, rest] = text.split('## 🏆 Arsenal Certifications')
          const [_, afterTechnical] = rest.split('## 🛠️ Technical Arsenal')
          
          const beforeHtml = await processContent(beforeCert)
          const afterHtml = await processContent('## 🛠️ Technical Arsenal' + afterTechnical)
          
          setContent(`${beforeHtml}<h2>🏆 Arsenal Certifications</h2><div id="cert-placeholder"></div>${afterHtml}`)
        } else {
          // For other markdown files, process the entire content
          const processedContent = await processContent(text)
          setContent(processedContent)
        }
        
        setError(null)
      } catch (err) {
        console.error('Error fetching content:', err)
        setError('Failed to load content')
        setContent('')
      }
    }

    if (filePath) {
      fetchContent()
    }
  }, [filePath])

  if (error) {
    return (
      <Box p={4} bg="rgba(255, 0, 0, 0.1)" borderRadius="md">
        <Text color="red.300">{error}</Text>
      </Box>
    )
  }

  // If this is About-me.md, insert the Certifications component
  if (filePath === 'Content/Intro/About-me.md') {
    const [before, after] = content.split('<div id="cert-placeholder"></div>')
    return (
      <Box 
        className="markdown-content"
        p={6} 
        bg="rgba(0, 0, 0, 0.3)"
        borderRadius="lg"
        backdropFilter="blur(12px)"
      >
        <Box dangerouslySetInnerHTML={{ __html: before }} />
        <Certifications />
        <Box dangerouslySetInnerHTML={{ __html: after }} />
      </Box>
    )
  }

  // For other files, render the content directly
  return (
    <Box 
      className="markdown-content"
      p={6} 
      bg="rgba(0, 0, 0, 0.3)"
      borderRadius="lg"
      backdropFilter="blur(12px)"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('Content/Intro/About-me.md');

  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
  };

  return (
    <ChakraProvider theme={theme}>
      <CircuitBackground />
      <Box position="relative" minH="100vh" overflow="hidden" bg="#040B14">
        <Header />
        <Sidebar onFileSelect={handleFileSelect} />
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
