import axios from 'axios';
import { Platform } from 'react-native';

// Configure the base URL for Ollama API
// When testing in an emulator or real device, use your computer's actual IP address
// Find your IP address by running 'ipconfig' in command prompt (Windows) or 'ifconfig' on Mac/Linux
const OLLAMA_BASE_URL = 'http://192.168.1.11:11434/api'; 
// If using a real device on the same WiFi network as your computer, use your computer's local IP:
// const OLLAMA_BASE_URL = 'http://192.168.x.x:11434/api'; // Replace with your actual IP

// The model to use - change this if you have pulled a different model
// Recommended models for better JSON formatting:
// - llama2 (better at following instructions)
// - codellama (good at generating structured outputs like JSON)
// - mistral (good general performance)
const AI_MODEL = 'llama2';

// Flag to use mock responses
// Always use mock responses on mobile devices
const USE_MOCK_RESPONSES = Platform.OS === 'ios' || Platform.OS === 'android';

// Log the platform and mock response setting
console.log(`Running on platform: ${Platform.OS}`);
console.log(`Using mock responses: ${USE_MOCK_RESPONSES}`);

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
const parseAiResponse = (response) => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0];
      
      // Clean up potential formatting issues
      // Check for trailing commas followed by a closing bracket
      jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');
      
      // Remove any ellipses or comments that might be inside the JSON
      jsonStr = jsonStr.replace(/\.\.\..*?"/g, '"');
      jsonStr = jsonStr.replace(/\.\.\..*?}/g, '}');
      jsonStr = jsonStr.replace(/\.\.\..*?]/g, ']');
      
      // Remove any trailing incomplete entries
      if (jsonStr.includes('...more')) {
        const lastValidBracket = jsonStr.lastIndexOf('}');
        if (lastValidBracket > 0) {
          const lastValidComma = jsonStr.lastIndexOf('},', lastValidBracket);
          if (lastValidComma > 0) {
            jsonStr = jsonStr.substring(0, lastValidComma + 1) + ']';
          }
        }
      }
      
      // Log the sanitized JSON for debugging
      console.log('Sanitized JSON:', jsonStr.substring(0, 100) + (jsonStr.length > 100 ? '...' : ''));
      
      return JSON.parse(jsonStr);
    }
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Generate a single insight with the raw response for the user
    return [{
      id: 'ai-response',
      title: 'AI Analysis',
      message: response,
      type: 'healthy',
      icon: 'analytics',
    }];
  }
};

// Helper function to check if Ollama is running
const isOllamaRunning = async () => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/tags`, { timeout: 30000 });
    return response.status === 200;
  } catch (error) {
    console.log('Ollama check failed:', error.message);
    return false;
  }
};

// Helper function to check if the model is available
const isModelAvailable = async (modelName) => {
  try {
    // Just try to run a simple query with the model
    const testResponse = await axios.post(`${OLLAMA_BASE_URL}/generate`, {
      model: modelName,
      prompt: "Hello",
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 10,
      }
    }, { timeout: 5000 });
    
    // If we got here without error, the model is available
    console.log(`Model ${modelName} test successful`);
    return true;
  } catch (error) {
    console.log(`Model ${modelName} test failed:`, error.message);
    // If the error contains "model not found", we know the model isn't available
    if (error.response && error.response.data && error.response.data.error) {
      const errorMsg = error.response.data.error.toLowerCase();
      if (errorMsg.includes('model not found') || errorMsg.includes('failed to load model')) {
        return false;
      }
    }
    // For other errors (network issues, etc.), assume the model might be available
    // This will let the main function try to use it anyway
    return true;
  }
};

// Function to get AI insights using Ollama
export const getAiInsights = async (hiveData, eventType = null) => {
  try {
    console.log('Attempting to generate AI insights for', hiveData.name);
    
    // Use mock responses while setting up
    if (USE_MOCK_RESPONSES) {
      console.log('Using mock responses while Ollama is being set up');
      return await generateMockAiResponse(hiveData, eventType);
    }
    
    // First, check if Ollama is running
    const ollamaAvailable = await isOllamaRunning();
    
    if (!ollamaAvailable) {
      console.log('Ollama not available, using mock responses');
      return await generateMockAiResponse(hiveData, eventType);
    }
    
    // Check if the required model is available
    const modelAvailable = await isModelAvailable(AI_MODEL);
    if (!modelAvailable) {
      console.log(`Model ${AI_MODEL} not available, using mock responses`);
      return await generateMockAiResponse(hiveData, eventType);
    }
    
    // Attempt to use Ollama API
    try {
      console.log('Generating insights using Ollama model:', AI_MODEL);
      const prompt = generatePrompt(hiveData, eventType);
      console.log('Sending prompt to Ollama...');
      
      const response = await axios.post(`${OLLAMA_BASE_URL}/generate`, {
        model: AI_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1500,
        }
      }, { timeout: 60000 }); // 60 second timeout for longer responses
      
      if (response.data && response.data.response) {
        console.log('Successfully received Ollama response');
        console.log('Response length:', response.data.response.length);
        
        // Debug first part of response
        console.log('Response preview:', response.data.response.substring(0, 100) + '...');
        
        // Clean up the response to ensure it's properly formatted for JSON parsing
        let cleanedResponse = response.data.response;
        
        // Extract just the JSON array if there's text before or after it
        const jsonMatch = cleanedResponse.match(/\[\s*{[\s\S]*}\s*\]/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }
        
        // Make sure the response has opening and closing brackets
        if (!cleanedResponse.trim().startsWith('[')) {
          cleanedResponse = '[' + cleanedResponse;
        }
        if (!cleanedResponse.trim().endsWith(']')) {
          cleanedResponse = cleanedResponse + ']';
        }
        
        const insights = parseAiResponse(cleanedResponse);
        if (insights && insights.length > 0) {
          // Add icons if missing
          const insightsWithIcons = insights.map(insight => {
            // Set a default icon based on the insight type if missing or invalid
            const validIcons = [
              'warning', 'bug', 'thermometer', 'water', 'analytics', 
              'medkit', 'trending-up', 'trending-down', 'calendar', 
              'information-circle', 'bulb'
            ];
            
            if (!insight.icon || !validIcons.includes(insight.icon)) {
              // Assign default icons based on type
              if (insight.type === 'critical') {
                insight.icon = 'warning';
              } else if (insight.type === 'warning') {
                insight.icon = 'alert-circle';
              } else {
                insight.icon = 'analytics';
              }
            }
            
            // Make sure type is one of the valid types
            if (!['critical', 'warning', 'healthy'].includes(insight.type)) {
              // Default to warning if not a valid type
              insight.type = 'warning';
            }
            
            return insight;
          });
          
          // De-duplicate insights (in case the model repeats itself)
          const uniqueInsights = [];
          const seenTitles = new Set();
          
          for (const insight of insightsWithIcons) {
            if (!seenTitles.has(insight.title)) {
              seenTitles.add(insight.title);
              uniqueInsights.push(insight);
            }
          }
          
          console.log(`Generated ${uniqueInsights.length} unique insights from Ollama response`);
          return uniqueInsights;
        } else {
          console.log('No insights were parsed from the response, falling back to mock');
          return await generateMockAiResponse(hiveData, eventType);
        }
      }
      
      console.log('Invalid response format from Ollama, falling back to mock');
      return await generateMockAiResponse(hiveData, eventType);
    } catch (ollamaError) {
      console.error('Ollama API error:', ollamaError.message);
      if (ollamaError.response) {
        console.error('Error response data:', ollamaError.response.data);
      }
      console.log('Falling back to mock implementation');
      // Fall back to mock implementation if Ollama fails
      return await generateMockAiResponse(hiveData, eventType);
    }
  } catch (error) {
    console.error('Error getting AI insights:', error.message);
    return [{
      id: 'error',
      title: 'Error Generating Insights',
      message: 'Unable to generate AI insights at this time. Please try again later. Error: ' + error.message,
      type: 'warning',
      icon: 'alert-circle',
    }];
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
              ? 'strong honey stores adequate for winter.' 
              : hiveData.sensors.weight > 25 
                ? 'moderate honey stores that should be monitored.' 
                : 'potential need for supplemental feeding.'
          }`,
          type: hiveData.sensors.weight > 25 ? 'healthy' : 'warning',
          icon: 'scale',
        });
      }
      
      resolve(insights);
    }, 1500); // 1.5 second simulated delay
  });
}; 