import { Box, Image, HStack } from '@chakra-ui/react';

const certifications = [
  {
    //name: 'OSWP',
    image: 'https://templates.images.credential.net/16776823122090017879526713130770.png',
    //provider: 'OffSec',
    //year: '2020'
  },
  {
    //name: 'OSCE',
    image: 'https://templates.images.credential.net/16776822423126238551944601227169.png',
    //provider: 'OffSec',
    //year: '2020'
  },
  {
    //name: 'OSCP',
    image: 'https://templates.images.credential.net/1677682410975725023965573912354.png',
    //provider: 'OffSec',
    //year: '2020'
  }
];

export const Certifications = () => {
  return (
    <Box>
      <HStack spacing={4} mb={4}>
        {certifications.map((cert, index) => (
          <Image
            key={index.id}
            src={cert.image}
            //alt={cert.name}
            maxWidth="200px"
            maxHeight="200px"
            width="20px"
            height="20px"
            objectFit="contain"
          />
        ))}
      </HStack>
      {/* <Box mb={4}>
        {certifications.map((cert, index) => (
          <Text
            key={index}
            as="code"
            display="inline-block"
            mx={2}
            p={2}
            bg="rgba(0, 0, 0, 0.3)"
            borderRadius="4px"
            border="1px solid rgba(22, 101, 216, 0.3)"
          >
            {cert.name}
          </Text>
        ))}
      </Box> */}
      {/* <Box>
        {certifications.map((cert, index) => (
          <Text
            key={index}
            as="code"
            display="inline-block"
            mx={2}
            p={2}
            bg="rgba(0, 0, 0, 0.3)"
            borderRadius="4px"
            border="1px solid rgba(22, 101, 216, 0.3)"
          >
            
            {cert.provider} [{cert.year}]
          
          </Text>
        ))}
      </Box> */}
    </Box>
  );
}; 