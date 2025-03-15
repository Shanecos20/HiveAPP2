import axios from 'axios';

// Configure the base URL for Ollama API
// For local Ollama instance running on your computer, use:
const OLLAMA_BASE_URL = 'http://localhost:11434/api';
// For a remote Ollama instance, use the IP address or domain
// const OLLAMA_BASE_URL = 'http://your-server-ip:11434/api';

// The model to use - you can change this to any model you have pulled in Ollama
const AI_MODEL = 'llama3';

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

Format your response as a JSON array of insight objects with the following structure:
[
  {
    "id": "unique-id",
    "title": "Short title for the insight",
    "message": "Detailed explanation and recommendations",
    "type": "critical|warning|healthy", 
    "icon": "appropriate-ionicon-name"
  },
  ...more insights
]

Use 'critical' type for urgent issues, 'warning' for potential problems, and 'healthy' for positive insights. For icon, use one of: warning, bug, thermometer, water, analytics, medkit, trending-up, trending-down, calendar, information-circle, bulb.`;

  return prompt;
};

// Parse AI response to extract valid JSON
const parseAiResponse = (response) => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Return fallback insights if parsing fails
    return [{
      id: 'parsing-error',
      title: 'Analysis Available',
      message: 'The AI generated insights but they could not be properly formatted. Here is the raw analysis:\n\n' + response,
      type: 'warning',
      icon: 'alert-circle',
    }];
  }
};

// Function to get AI insights using Ollama
export const getAiInsights = async (hiveData, eventType = null) => {
  try {
    // Use mock implementation for faster development and testing
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AI === 'true') {
      return await generateMockAiResponse(hiveData, eventType);
    }
    
    // Attempt to use Ollama API
    try {
      console.log('Generating insights using Ollama for', hiveData.name);
      const prompt = generatePrompt(hiveData, eventType);
      
      const response = await axios.post(`${OLLAMA_BASE_URL}/generate`, {
        model: AI_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1000,
        }
      });
      
      if (response.data && response.data.response) {
        const insights = parseAiResponse(response.data.response);
        if (insights && insights.length > 0) {
          return insights;
        }
      }
      
      throw new Error('Invalid response format from Ollama');
    } catch (ollamaError) {
      console.error('Ollama API error:', ollamaError);
      console.log('Falling back to mock implementation');
      // Fall back to mock implementation if Ollama fails
      return await generateMockAiResponse(hiveData, eventType);
    }
  } catch (error) {
    console.error('Error getting AI insights:', error);
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
  // Create a realistic delay to simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      let insights = [];
      
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
            message: `Hive "${hiveData.name}" has experienced a significant temperature increase to ${hiveData.sensors.temperature}°C. This is above the optimal brood nest temperature (34-35°C) and may indicate:\n\n1. Overheating due to environmental conditions\n2. Potential disease or stress in the colony\n3. Brood pattern issues or overcrowding`,
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
            message: `Hive "${hiveData.name}" is experiencing ${hiveData.sensors.humidity > 75 ? 'high' : 'low'} humidity levels (${hiveData.sensors.humidity}%). ${
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
          insights.push({
            id: 'general-analysis',
            title: 'Hive Health Assessment',
            message: `Based on the current data from hive "${hiveData.name}", the colony appears to be ${hiveData.status}. The temperature is ${hiveData.sensors.temperature}°C, humidity is ${hiveData.sensors.humidity}%, and varroa count is approximately ${hiveData.sensors.varroa} mites per 100 bees.`,
            type: hiveData.status,
            icon: 'analytics',
          });
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
        seasonalInsight.message = 'Fall management recommendations for the coming weeks:\n\n1. Assess honey stores for winter - approximately 40-60 pounds needed depending on your climate\n2. Complete varroa treatments before cold weather\n3. Consider combining weak colonies\n4. Reduce entrances to prevent robbing and install mouse guards';
      } 
      // Winter (December-February)
      else {
        seasonalInsight.message = 'Winter management recommendations for the coming weeks:\n\n1. Minimize hive disturbances except on warm days (>12°C)\n2. Ensure adequate ventilation to prevent condensation\n3. Heft the hive to gauge food stores\n4. Consider emergency feeding if stores are light\n5. Clear entrances after snow events';
      }
      
      insights.push(seasonalInsight);
      
      resolve(insights);
    }, 2000);
  });
}; 