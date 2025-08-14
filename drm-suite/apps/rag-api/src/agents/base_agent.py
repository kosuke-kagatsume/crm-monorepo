from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from langchain.memory import ConversationBufferMemory
from langchain.schema import BaseMessage
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import LLMChain
import logging

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Base class for all specialized agents in the DRM Suite"""
    
    def __init__(
        self,
        name: str,
        role: str,
        model_name: str = "gpt-4-turbo-preview",
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ):
        self.name = name
        self.role = role
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            model_name=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
        )
        
        # Initialize prompt template
        self.prompt = self._create_prompt_template()
        
        # Initialize chain
        self.chain = LLMChain(
            llm=self.llm,
            prompt=self.prompt,
            memory=self.memory,
        )
        
        logger.info(f"Initialized {self.name} agent with role: {self.role}")
    
    @abstractmethod
    def _create_prompt_template(self) -> ChatPromptTemplate:
        """Create agent-specific prompt template"""
        pass
    
    @abstractmethod
    def _get_capabilities(self) -> List[str]:
        """Return list of agent capabilities"""
        pass
    
    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input and return agent response"""
        pass
    
    async def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a task with optional context"""
        try:
            # Prepare input
            input_data = {
                "task": task,
                "context": context or {},
                "agent": self.name,
                "role": self.role,
            }
            
            # Process through agent
            result = await self.process(input_data)
            
            # Log execution
            logger.info(f"{self.name} successfully executed task: {task[:50]}...")
            
            return {
                "success": True,
                "agent": self.name,
                "result": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed to execute task: {str(e)}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
            }
    
    def add_to_memory(self, message: BaseMessage):
        """Add a message to agent's memory"""
        self.memory.chat_memory.add_message(message)
    
    def clear_memory(self):
        """Clear agent's conversation memory"""
        self.memory.clear()
    
    def get_memory_summary(self) -> str:
        """Get a summary of conversation memory"""
        messages = self.memory.chat_memory.messages
        if not messages:
            return "No conversation history"
        
        summary = f"Conversation history ({len(messages)} messages):\n"
        for msg in messages[-5:]:  # Last 5 messages
            role = "Human" if msg.type == "human" else "AI"
            content = msg.content[:100] + "..." if len(msg.content) > 100 else msg.content
            summary += f"- {role}: {content}\n"
        
        return summary
    
    def get_info(self) -> Dict[str, Any]:
        """Get agent information"""
        return {
            "name": self.name,
            "role": self.role,
            "capabilities": self._get_capabilities(),
            "model": self.model_name,
            "temperature": self.temperature,
            "memory_size": len(self.memory.chat_memory.messages),
        }