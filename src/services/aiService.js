import axios from 'axios';
import { Platform } from 'react-native';

// Configure the base URL for your local proxy server
// --- IMPORTANT ---
// Find your computer's local IP address:
// - Windows: Run 'ipconfig' in Command Prompt and look for 'IPv4 Address' under your active network adapter (Wi-Fi or Ethernet).
// - macOS: Run 'ifconfig | grep "inet "' in Terminal and look for the 'inet' address (usually starting with 192.168.x.x or 10.x.x.x).
// - Linux: Run 'ip addr show' in Terminal and look for the 'inet' address under your active network interface.
//
// Replace 'YOUR_COMPUTER_IP_ADDRESS' with the actual IP you found.
// The port (3001) should match the SERVER_PORT in your server/.env file.
const PROXY_SERVER_BASE_URL = `http://192.168.1.5:3001/api`; // <-- Ensure port is 3001

// --- DEVELOPMENT ONLY ---
// For testing on an emulator/simulator running on the SAME machine as the server, you might use localhost:
// const PROXY_SERVER_BASE_URL = 'http://localhost:3001/api';

// Flag to use mock responses (can be useful if server isn't running or for offline dev)
const USE_MOCK_RESPONSES = false; // Set to true to force mock data

// Log the platform and mock response setting
console.log(`Running on platform: ${Platform.OS}`);
console.log(`Using mock responses: ${USE_MOCK_RESPONSES}`);
console.log(`Proxy Server URL: ${PROXY_SERVER_BASE_URL}`);

// Function to generate prompts based on hive data
const generatePrompt = (hiveData, eventType) => {
  let prompt = `You are a professional beekeeper AI assistant. Analyze the following data for a beehive called "${hiveData.name}" and provide detailed insights and recommendations:\n\n`;
  
  prompt += `Temperature: ${hiveData.sensors.temperature}°C\n`;
  prompt += `Humidity: ${hiveData.sensors.humidity}%\n`;
  prompt += `Varroa mite index: ${hiveData.sensors.varroa}\n`;
  prompt += `Weight: ${hiveData.sensors.weight} kg\n`;
  prompt += `Current status: ${hiveData.status}\n\n`;
  
  if (eventType) {
    switch(eventType) {
      case 'swarm':
        prompt += `IMPORTANT: The hive has experienced a sudden drop in weight, suggesting a SWARM EVENT has occurred.\n`;
        break;
      case 'varroa':
        prompt += `IMPORTANT: The hive has shown a significant increase in varroa mite levels, suggesting a VARROA OUTBREAK.\n`;
        break;
      case 'temperature':
        prompt += `IMPORTANT: The hive has experienced a significant TEMPERATURE SPIKE.\n`;
        break;
      case 'humidity':
        prompt += `IMPORTANT: The hive has experienced unusual HUMIDITY levels.\n`;
        break;
    }
  }
  
  prompt += `Based on this data, provide:
1. A current status analysis of the hive health
2. Recommendations for immediate actions
3. Long-term management strategies
4. Seasonal considerations (current month: ${new Date().toLocaleString('en-us', { month: 'long' })})

IMPORTANT: YOU MUST RETURN ONLY A VALID JSON ARRAY. DO NOT EXPLAIN THE STRUCTURE OR PROVIDE INSTRUCTIONS.
DO NOT INCLUDE ANY TEXT BEFORE OR AFTER THE JSON ARRAY.

Format your response as a JSON array of insight objects with exactly this structure:
[
  {
    "id": "unique-identifier-1",
    "title": "Short informative title",
    "message": "Detailed explanation and recommendations",
    "type": "critical|warning|healthy", 
    "icon": "warning|bug|thermometer|water|analytics|medkit|trending-up|trending-down|calendar|information-circle|bulb"
  },
  {
    "id": "unique-identifier-2",
    "title": "Another informative title",
    "message": "More detailed explanation and recommendations",
    "type": "critical|warning|healthy", 
    "icon": "warning|bug|thermometer|water|analytics|medkit|trending-up|trending-down|calendar|information-circle|bulb"
  },
  ...
]

Use 'critical' type for urgent issues, 'warning' for potential problems, and 'healthy' for positive insights.
For icon, choose ONE appropriate icon from this list only: warning, bug, thermometer, water, analytics, medkit, trending-up, trending-down, calendar, information-circle, bulb.

DO NOT include explanations of the JSON format or sample/template JSON. 
ONLY return an actual, complete, valid JSON array with real insights.
DO NOT include YouTube links in your responses.`;

  return prompt;
};

// Parse AI response to extract valid JSON
const parseAiResponse = (responseContent) => {
  try {
    // Deepseek response is expected to be directly in the 'content' field
    // Attempt to parse the content directly as JSON
    console.log('Attempting to parse AI response content:', responseContent.substring(0, 100) + '...');
    let insights = JSON.parse(responseContent);

    // Basic validation
    if (!Array.isArray(insights)) {
      throw new Error('Parsed response is not an array');
    }
    if (insights.length === 0) {
       console.warn('Parsed response is an empty array.');
       // You might return an empty array or a default message here
       // return []; // Option 1: return empty array
       return [{ id: 'no-insights', title: 'No Specific Insights', message: 'AI analysis complete, no specific issues detected.', type: 'healthy', icon: 'information-circle' }]; // Option 2: Default message
    }

    // Further validation (check for required fields in the first item)
    if (!insights[0].id || !insights[0].title || !insights[0].message || !insights[0].type || !insights[0].icon) {
       console.warn('Parsed insights might be missing required fields.');
    }


    // Clean up potential formatting issues (less likely needed if model follows instructions well)
    // Remove this section if Deepseek consistently returns clean JSON
    // insights = insights.map(insight => {
    //   // Example: Trim whitespace from strings
    //   if (insight.title) insight.title = insight.title.trim();
    //   if (insight.message) insight.message = insight.message.trim();
    //   return insight;
    // });

    console.log('Successfully parsed JSON from AI response content.');
    return insights;

  } catch (error) {
    console.error('Error parsing AI response content:', error);
    console.error('Raw response content received:', responseContent); // Log the raw content

    // Attempt to extract JSON array even if parsing failed initially (e.g., if wrapped in text)
    const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        console.log('Attempting to parse extracted JSON string...');
        let jsonStr = jsonMatch[0];
         // Basic cleanup for trailing commas, etc. (similar to original)
        jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');
        const extractedInsights = JSON.parse(jsonStr);
        if (Array.isArray(extractedInsights) && extractedInsights.length > 0) {
           console.log('Successfully parsed extracted JSON string.');
           return extractedInsights; // Return the extracted array if valid
        }
      } catch (extractError) {
         console.error('Error parsing extracted JSON string:', extractError);
      }
    }


    // Fallback: Return a single insight with the raw response for debugging
    return [{
      id: 'ai-parse-error',
      title: 'AI Response Format Issue',
      message: `Could not parse the AI's response. Raw response: ${responseContent.substring(0, 200)}...`, // Show beginning of raw response
      type: 'warning',
      icon: 'alert-circle',
    }];
  }
};

// Helper function to check if the proxy server is running
const isProxyServerRunning = async () => {
  try {
    // Use a simple GET request to the server's root or a dedicated health endpoint
    const response = await axios.get(PROXY_SERVER_BASE_URL.replace('/api', ''), { timeout: 5000 }); // Check base URL
    return response.status === 200;
  } catch (error) {
    console.log('Proxy server check failed:', error.message);
    return false;
  }
};

// Function to get AI insights using the proxy server
export const getAiInsights = async (hiveData, eventType = null) => {
  try {
    console.log(`Attempting to generate AI insights for ${hiveData.name} via proxy server`);

    if (USE_MOCK_RESPONSES) {
      console.log('USE_MOCK_RESPONSES is true, using mock data.');
      return await generateMockAiResponse(hiveData, eventType);
    }

    // Optional: Check if proxy server is running first (adds slight delay)
    // const serverAvailable = await isProxyServerRunning();
    // if (!serverAvailable) {
    //   console.log('Proxy server not available, using mock responses.');
    //   return await generateMockAiResponse(hiveData, eventType);
    // }

    // Generate the prompt
    const prompt = generatePrompt(hiveData, eventType);
    console.log('Sending prompt to proxy server...');

    // Call the proxy server's /api/chat endpoint
    const response = await axios.post(
      `${PROXY_SERVER_BASE_URL}/chat`,
      { prompt: prompt }, // Send prompt in the request body
      { timeout: 90000 } // Increase timeout (e.g., 90 seconds) for potentially longer AI generation
    );

    // The proxy server returns the 'message' object from OpenRouter's response
    if (response.data && response.data.content) {
      console.log('Successfully received response from proxy server.');
      // console.log('Raw response content:', response.data.content); // For debugging

      // Parse the JSON content string from the response
      const insights = parseAiResponse(response.data.content);

      if (insights && insights.length > 0 && insights[0].id !== 'ai-parse-error') {
          // Add icons if missing (optional, keep if needed)
          const insightsWithIcons = insights.map(insight => {
            const validIcons = [
              'warning', 'bug', 'thermometer', 'water', 'analytics',
              'medkit', 'trending-up', 'trending-down', 'calendar',
              'information-circle', 'bulb', 'alert-circle', 'checkmark-circle',
              'snow', 'umbrella', 'scale', 'build' // Added icons from mock data
            ];

            if (!insight.icon || !validIcons.includes(insight.icon)) {
              if (insight.type === 'critical') insight.icon = 'warning';
              else if (insight.type === 'warning') insight.icon = 'alert-circle';
              else insight.icon = 'information-circle'; // Default to info
            }
             // Make sure type is one of the valid types
            if (!['critical', 'warning', 'healthy'].includes(insight.type)) {
              insight.type = 'warning'; // Default to warning
            }
            // Ensure unique IDs (simple approach using index if model doesn't provide unique ones)
             if (!insight.id) {
               insight.id = `insight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            }

            return insight;
          });

          // De-duplicate insights (optional, keep if needed)
          const uniqueInsights = [];
          const seenTitles = new Set();
          for (const insight of insightsWithIcons) {
            if (!seenTitles.has(insight.title)) {
              seenTitles.add(insight.title);
              uniqueInsights.push(insight);
            } else {
               console.log(`Duplicate insight title removed: "${insight.title}"`);
            }
          }

          console.log(`Generated ${uniqueInsights.length} unique insights from AI response`);
          return uniqueInsights;
        } else {
          console.log('No valid insights were parsed from the response or a parse error occurred, falling back to mock.');
          // If parsing failed, insights will contain the error message object
          if (insights && insights[0] && insights[0].id === 'ai-parse-error') {
            return insights; // Return the error insight to display it in the UI
          }
          return await generateMockAiResponse(hiveData, eventType); // Fallback to mock
        }
    } else {
      console.log('Invalid response format from proxy server, falling back to mock.');
      return await generateMockAiResponse(hiveData, eventType);
    }

  } catch (error) {
    console.error('Error calling proxy server:', error.message);
    if (error.response) {
      // Log detailed error from proxy if available
      console.error('Proxy Error Response Status:', error.response.status);
      console.error('Proxy Error Response Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from proxy server. Is it running? Is the IP address correct?');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request to proxy server:', error.message);
    }

    console.log('Falling back to mock implementation due to error.');
    // Consider returning a specific error message instead of mock data
    return [{
      id: 'proxy-error',
      title: 'AI Service Unavailable',
      message: `Could not connect to the AI service via the proxy server. Please ensure the server is running and the IP address is correct. Error: ${error.message}`,
      type: 'critical',
      icon: 'alert-circle',
    }];
    // return await generateMockAiResponse(hiveData, eventType); // Or fallback to mock
  }
};

// Mock AI response generator (kept for fallback)
const generateMockAiResponse = (hiveData, eventType) => {
  console.log('Generating enhanced mock AI response for', eventType || 'general analysis');
  // Create a realistic delay to simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      let insights = [];
      
      // Random variation to make insights feel more realistic
      const randomizeTemperature = () => (Math.random() * 1.5 - 0.75).toFixed(1);
      const randomizeHumidity = () => (Math.random() * 3 - 1.5).toFixed(1);
      const randomizeWeight = () => (Math.random() * 0.4 - 0.15).toFixed(2);
      
      const hiveTempWithVariation = (parseFloat(hiveData.sensors.temperature) + parseFloat(randomizeTemperature())).toFixed(1);
      const hiveHumidityWithVariation = (parseFloat(hiveData.sensors.humidity) + parseFloat(randomizeHumidity())).toFixed(1);
      
      // Base response based on event type
      switch(eventType) {
        case 'swarm':
          insights.push({
            id: 'swarm-analysis',
            title: 'Swarm Event Detected',
            message: `Your hive "${hiveData.name}" has shown a sudden drop in weight, which typically indicates a swarm event. About 60% of the worker bees likely left with the old queen. Look for swarm cells in the hive and consider these steps:\n\n1. Inspect all frames for queen cells\n2. Check if a new queen has emerged\n3. Verify if eggs are present (indicates queen is laying)\n4. Consider adding a frame of open brood if queenless`,
            type: 'critical',
            icon: 'warning',
          });
          insights.push({
            id: 'swarm-recovery',
            title: 'Swarm Recovery Plan',
            message: 'After a swarm, the colony will be significantly reduced in population. To help recovery:\n\n1. Reduce hive space temporarily to match the smaller colony size\n2. Ensure adequate food resources - consider light feeding if nectar flow is minimal\n3. Monitor for successful queen mating if a new queen is present\n4. Avoid inspections for 2-3 weeks to allow the new queen to establish',
            type: 'warning',
            icon: 'build',
          });
          break;
          
        case 'varroa':
          insights.push({
            id: 'varroa-analysis',
            title: 'Varroa Mite Outbreak',
            message: `High varroa levels detected in hive "${hiveData.name}". Current mite count is approximately ${hiveData.sensors.varroa} mites per 100 bees, which exceeds the treatment threshold. Immediate action is required to prevent colony collapse and associated viral diseases.`,
            type: 'critical',
            icon: 'bug',
          });
          insights.push({
            id: 'varroa-treatment',
            title: 'Recommended Treatment Options',
            message: 'Based on the current season and infestation level, consider these treatment options:\n\n1. Organic acids: Formic acid provides quick knockdown and penetrates cappings\n2. Thymol-based treatments: Effective with lower temperature sensitivity\n3. Oxalic acid: Consider if brood levels are low\n\nApply treatment according to manufacturer instructions and monitor drop counts after application.',
            type: 'warning',
            icon: 'medkit',
          });
          insights.push({
            id: 'varroa-long-term',
            title: 'Long-term Varroa Management',
            message: 'To prevent future outbreaks:\n\n1. Implement regular monitoring with sticky boards or alcohol wash\n2. Consider using screened bottom boards\n3. Select for hygienic or resistant bee stock in future queens\n4. Implement drone brood removal as a cultural control method during spring buildup',
            type: 'healthy',
            icon: 'calendar',
          });
          break;
          
        case 'temperature':
          insights.push({
            id: 'temp-analysis',
            title: 'Temperature Spike Alert',
            message: `Hive "${hiveData.name}" has experienced a significant temperature increase to ${hiveTempWithVariation}°C. This is above the optimal brood nest temperature (34-35°C) and may indicate:\n\n1. Overheating due to environmental conditions\n2. Potential disease or stress in the colony\n3. Brood pattern issues or overcrowding`,
            type: 'warning',
            icon: 'thermometer',
          });
          insights.push({
            id: 'temp-recommendations',
            title: 'Cooling Recommendations',
            message: 'To address the temperature spike:\n\n1. Provide additional ventilation by propping the outer cover slightly\n2. Consider adding an entrance reducer to allow better airflow control\n3. Provide shade if the hive is in direct sunlight\n4. If temperatures remain high, consider adding a small water source nearby for bees to collect water for evaporative cooling',
            type: 'warning',
            icon: 'snow',
          });
          break;
        
        case 'humidity':
          insights.push({
            id: 'humidity-analysis',
            title: 'Humidity Alert',
            message: `Hive "${hiveData.name}" is experiencing ${hiveData.sensors.humidity > 75 ? 'high' : 'low'} humidity levels (${hiveHumidityWithVariation}%). ${
              hiveData.sensors.humidity > 75 
                ? 'Excessive humidity can lead to mold growth, difficulty curing honey, and increased risk of fungal diseases.' 
                : 'Low humidity can cause stress on the colony and lead to dehydration of developing larvae.'
            }`,
            type: 'warning',
            icon: 'water',
          });
          insights.push({
            id: 'humidity-recommendations',
            title: 'Humidity Management',
            message: hiveData.sensors.humidity > 75 
              ? 'To reduce excess humidity:\n\n1. Improve ventilation by adding an upper entrance\n2. Consider adding a moisture quilt or moisture board above the inner cover\n3. Ensure the hive has a slight forward tilt to allow water to drain out\n4. Reduce the entrance size if rain is entering the hive'
              : 'To address low humidity:\n\n1. Consider adding a small water source nearby for bees to collect\n2. Reduce excessive ventilation during dry periods\n3. If feeding syrup, use a higher water ratio\n4. Monitor for signs of dehydration in developing brood',
            type: 'warning',
            icon: hiveData.sensors.humidity > 75 ? 'umbrella' : 'water',
          });
          break;
          
        default:
          // Generate a dynamic health assessment based on hive values
          const tempStatus = hiveData.sensors.temperature > 36 ? 'critical' : 
                             hiveData.sensors.temperature > 33 ? 'warning' : 'healthy';
          
          const humidityStatus = hiveData.sensors.humidity > 80 ? 'critical' :
                                 hiveData.sensors.humidity > 75 ? 'warning' :
                                 hiveData.sensors.humidity < 40 ? 'warning' : 'healthy';
          
          const varroaStatus = hiveData.sensors.varroa > 3 ? 'critical' :
                              hiveData.sensors.varroa > 2 ? 'warning' : 'healthy';
          
          // Overall status is the worst of the individual statuses
          const overallStatus = [tempStatus, humidityStatus, varroaStatus].includes('critical') ? 'critical' :
                               [tempStatus, humidityStatus, varroaStatus].includes('warning') ? 'warning' : 'healthy';
          
          insights.push({
            id: 'general-analysis',
            title: `Hive Health Assessment: ${overallStatus === 'critical' ? 'Critical Issues' : 
                                            overallStatus === 'warning' ? 'Needs Attention' : 'Good Condition'}`,
            message: `Based on the current data from hive "${hiveData.name}", the colony appears to be in ${overallStatus} condition.\n\n• Temperature: ${hiveTempWithVariation}°C (${tempStatus})\n• Humidity: ${hiveHumidityWithVariation}% (${humidityStatus})\n• Varroa count: ${hiveData.sensors.varroa} mites per 100 bees (${varroaStatus})`,
            type: overallStatus,
            icon: overallStatus === 'critical' ? 'warning' : 
                 overallStatus === 'warning' ? 'alert-circle' : 'checkmark-circle',
          });
          
          // Add specific insights based on which parameters are problematic
          if (tempStatus !== 'healthy') {
            insights.push({
              id: 'temperature-insight',
              title: hiveData.sensors.temperature > 36 ? 'Temperature Too High' : 'Temperature Alert',
              message: `The hive temperature of ${hiveTempWithVariation}°C is ${hiveData.sensors.temperature > 36 ? 'dangerously high' : 'above optimal range'}. This could affect brood development and stress the colony. Consider improving ventilation or providing shade if the hive is in direct sunlight.`,
              type: tempStatus,
              icon: 'thermometer',
            });
          }
          
          if (humidityStatus !== 'healthy') {
            insights.push({
              id: 'humidity-insight',
              title: hiveData.sensors.humidity > 80 ? 'Excessive Humidity' : 
                    hiveData.sensors.humidity > 75 ? 'High Humidity' : 'Low Humidity',
              message: hiveData.sensors.humidity > 75 ?
                `The humidity level of ${hiveHumidityWithVariation}% is higher than optimal. This can promote mold growth and affect honey curing. Consider improving ventilation to reduce moisture levels.` :
                `The humidity level of ${hiveHumidityWithVariation}% is lower than ideal. This may cause stress on developing larvae. Consider adding a water source nearby for the bees to collect.`,
              type: humidityStatus,
              icon: 'water',
            });
          }
          
          if (varroaStatus !== 'healthy') {
            insights.push({
              id: 'varroa-insight',
              title: hiveData.sensors.varroa > 3 ? 'Critical Varroa Infestation' : 'Varroa Levels Increasing',
              message: `The varroa mite level of ${hiveData.sensors.varroa} mites per 100 bees is ${hiveData.sensors.varroa > 3 ? 'critical and requires immediate treatment' : 'concerning and should be monitored closely'}. Consider appropriate treatment options based on your beekeeping philosophy and local regulations.`,
              type: varroaStatus,
              icon: 'bug',
            });
          }
      }
      
      // Add a long-term recommendation based on season
      const currentMonth = new Date().getMonth();
      let seasonalInsight = {
        id: 'seasonal-advice',
        title: 'Seasonal Management Advice',
        type: 'healthy',
        icon: 'calendar',
      };
      
      // Spring (March-May)
      if (currentMonth >= 2 && currentMonth <= 4) {
        seasonalInsight.message = 'Spring management recommendations for the coming weeks:\n\n1. Continue swarm prevention measures by providing adequate space\n2. Monitor for queen cells during every inspection\n3. Consider adding supers as nectar flow increases\n4. Begin varroa monitoring schedule for the season';
      } 
      // Summer (June-August)
      else if (currentMonth >= 5 && currentMonth <= 7) {
        seasonalInsight.message = 'Summer management recommendations for the coming weeks:\n\n1. Monitor nectar flow and add supers as needed\n2. Ensure adequate ventilation during hot periods\n3. Watch for robbing when nectar flow diminishes\n4. Plan for late summer varroa treatments after honey harvest';
      }
      // Fall (September-November) 
      else if (currentMonth >= 8 && currentMonth <= 10) {
        seasonalInsight.message = 'Fall management recommendations for the coming weeks:\n\n1. Assess and treat for varroa mites if needed\n2. Ensure adequate winter food stores (40-60 lbs of honey)\n3. Reduce entrances to prevent robbing as nectar flow ends\n4. Consider combining weak colonies that may not survive winter';
      }
      // Winter (December-February)
      else {
        seasonalInsight.message = 'Winter management recommendations for the coming weeks:\n\n1. Minimize hive disturbance during cold weather\n2. Clear snow from entrances if needed\n3. Consider emergency feeding if stores are low\n4. Begin planning for spring management and equipment needs';
      }
      
      insights.push(seasonalInsight);
      
      // Add a weight trend insight if not a swarm event
      if (eventType !== 'swarm') {
        const weightWithVariation = (parseFloat(hiveData.sensors.weight) + parseFloat(randomizeWeight())).toFixed(2);
        insights.push({
          id: 'weight-analysis',
          title: 'Weight Trend Analysis',
          message: `The current hive weight of ${weightWithVariation} kg indicates ${
            hiveData.sensors.weight > 40 
              ? 'strong honey stores potentially adequate for winter.' 
              : hiveData.sensors.weight > 25 
                ? 'moderate honey stores that should be monitored carefully.' 
                : 'low stores, likely requiring supplemental feeding.'
          }`,
          type: hiveData.sensors.weight > 25 ? 'healthy' : 'warning',
          icon: 'scale',
        });
      }
      
      resolve(insights);
    }, 1500); // 1.5 second simulated delay
  });
}; 