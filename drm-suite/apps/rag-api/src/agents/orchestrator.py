from typing import Dict, Any, List, Optional
from .sales_agent import SalesAgent
from .construction_agent import ConstructionAgent
from .finance_agent import FinanceAgent
from .customer_agent import CustomerAgent
import logging
import asyncio

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """Orchestrator for managing multiple specialized agents"""
    
    def __init__(self):
        self.agents = {}
        self._initialize_agents()
        logger.info("Agent Orchestrator initialized")
    
    def _initialize_agents(self):
        """Initialize all available agents"""
        self.agents["sales"] = SalesAgent()
        self.agents["construction"] = ConstructionAgent()
        self.agents["finance"] = FinanceAgent()
        self.agents["customer"] = CustomerAgent()
        
        logger.info(f"Initialized {len(self.agents)} agents")
    
    def get_agent(self, agent_type: str):
        """Get a specific agent by type"""
        return self.agents.get(agent_type)
    
    def list_agents(self) -> List[Dict[str, Any]]:
        """List all available agents and their capabilities"""
        return [agent.get_info() for agent in self.agents.values()]
    
    async def route_task(self, task: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Route task to appropriate agent based on content"""
        # Classify task
        agent_type = self._classify_task(task)
        
        if agent_type not in self.agents:
            return {
                "success": False,
                "error": f"No suitable agent found for task: {task}",
            }
        
        # Execute task with selected agent
        agent = self.agents[agent_type]
        result = await agent.execute(task, context)
        
        return {
            **result,
            "selected_agent": agent_type,
        }
    
    async def multi_agent_collaboration(
        self,
        task: str,
        agents_to_use: List[str],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute task using multiple agents in collaboration"""
        results = {}
        accumulated_context = context or {}
        
        for agent_type in agents_to_use:
            if agent_type not in self.agents:
                logger.warning(f"Agent {agent_type} not found, skipping")
                continue
            
            agent = self.agents[agent_type]
            
            # Execute with accumulated context
            result = await agent.execute(task, accumulated_context)
            results[agent_type] = result
            
            # Update context with agent's output for next agent
            if result.get("success"):
                accumulated_context[f"{agent_type}_output"] = result.get("result", {})
        
        return {
            "task": task,
            "agents_used": agents_to_use,
            "results": results,
            "final_context": accumulated_context,
        }
    
    async def parallel_execution(
        self,
        tasks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Execute multiple tasks in parallel across different agents"""
        async def execute_task(task_info):
            task = task_info.get("task", "")
            agent_type = task_info.get("agent", None)
            context = task_info.get("context", {})
            
            if agent_type:
                # Use specified agent
                if agent_type in self.agents:
                    return await self.agents[agent_type].execute(task, context)
                else:
                    return {"success": False, "error": f"Agent {agent_type} not found"}
            else:
                # Auto-route to appropriate agent
                return await self.route_task(task, context)
        
        # Execute all tasks in parallel
        results = await asyncio.gather(*[execute_task(task) for task in tasks])
        
        return results
    
    def _classify_task(self, task: str) -> str:
        """Classify task to determine appropriate agent"""
        task_lower = task.lower()
        
        # Sales-related keywords
        if any(word in task_lower for word in [
            "見積", "営業", "提案", "商談", "成約", "価格", "契約"
        ]):
            return "sales"
        
        # Construction-related keywords
        elif any(word in task_lower for word in [
            "工事", "施工", "工程", "資材", "進捗", "現場", "安全"
        ]):
            return "construction"
        
        # Finance-related keywords
        elif any(word in task_lower for word in [
            "収支", "売上", "利益", "予算", "経費", "財務", "会計"
        ]):
            return "finance"
        
        # Customer-related keywords
        elif any(word in task_lower for word in [
            "顧客", "お客様", "クレーム", "満足", "問い合わせ", "サポート"
        ]):
            return "customer"
        
        # Default to sales agent
        return "sales"
    
    async def generate_comprehensive_report(
        self,
        report_type: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate comprehensive report using multiple agents"""
        
        if report_type == "project_summary":
            # Use all agents to create comprehensive project summary
            agents_sequence = ["sales", "construction", "finance", "customer"]
            
            task = f"プロジェクト{context.get('project_id', '')}の総合レポートを作成"
            
            result = await self.multi_agent_collaboration(
                task=task,
                agents_to_use=agents_sequence,
                context=context
            )
            
            # Synthesize results
            synthesis = self._synthesize_reports(result["results"])
            
            return {
                "report_type": report_type,
                "synthesis": synthesis,
                "detailed_results": result,
            }
        
        elif report_type == "monthly_review":
            # Parallel execution for monthly metrics
            tasks = [
                {"task": "月次売上分析", "agent": "sales"},
                {"task": "月次工事進捗", "agent": "construction"},
                {"task": "月次収支報告", "agent": "finance"},
                {"task": "月次顧客満足度", "agent": "customer"},
            ]
            
            results = await self.parallel_execution(tasks)
            
            return {
                "report_type": report_type,
                "monthly_metrics": results,
            }
        
        else:
            return {
                "success": False,
                "error": f"Unknown report type: {report_type}",
            }
    
    def _synthesize_reports(self, results: Dict[str, Any]) -> str:
        """Synthesize multiple agent reports into unified summary"""
        synthesis = "統合レポート:\n\n"
        
        for agent_type, result in results.items():
            if result.get("success"):
                agent_name = self.agents[agent_type].name
                synthesis += f"【{agent_name}】\n"
                synthesis += f"{result.get('result', {}).get('response', 'No data')}[:500]\n\n"
        
        return synthesis
    
    def reset_all_agents(self):
        """Reset memory for all agents"""
        for agent in self.agents.values():
            agent.clear_memory()
        logger.info("All agent memories cleared")
    
    def get_orchestrator_status(self) -> Dict[str, Any]:
        """Get status of the orchestrator and all agents"""
        return {
            "active_agents": len(self.agents),
            "agents": {
                name: {
                    "info": agent.get_info(),
                    "memory_summary": agent.get_memory_summary(),
                }
                for name, agent in self.agents.items()
            },
        }