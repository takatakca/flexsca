// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { acceptedAttributionResponse, attributionCompletionOutcome } from '../../supabase/functions/_shared/attribution';

describe('bounded TakaTak delivery acknowledgement',()=>{
  it('accepts the documented successful and duplicate acknowledgements',async()=>{
    for(const duplicate of [false,true])expect(await acceptedAttributionResponse(Response.json({ok:true,recorded:!duplicate,duplicate,eventId:'event'}))).toBe(true);
  });
  it('rejects HTTP failures, false or missing acknowledgement, malformed JSON, and invalid UTF-8',async()=>{
    for(const response of [Response.json({ok:true},{status:503}),Response.json({ok:false}),Response.json({message:'ok'}),Response.json([{ok:true}]),Response.json(null),new Response('invalid JSON'),new Response(new Uint8Array([255]))]) {
      expect(await acceptedAttributionResponse(response)).toBe(false);
    }
  });
  it('cancels oversized advertised bodies without reading them',async()=>{
    let cancelled=false;
    const stream=new ReadableStream({cancel(){cancelled=true;}});
    expect(await acceptedAttributionResponse(new Response(stream,{headers:{'content-length':'16001'}}))).toBe(false);
    expect(cancelled).toBe(true);
  });
  it('bounds chunked responses even when Content-Length is absent or dishonest',async()=>{
    for(const headers of [{},{'content-length':'1'}]) {
      let cancelled=false;
      const stream=new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(9000));},cancel(){cancelled=true;}});
      expect(await acceptedAttributionResponse(new Response(stream,{headers}))).toBe(false);expect(cancelled).toBe(true);
    }
    expect(await acceptedAttributionResponse(Response.json({ok:true}),10)).toBe(false);
  });
  it('does not count remote acceptance when the database rejects a stale lease',()=>{
    expect(attributionCompletionOutcome(false,true)).toBe('stale');
    expect(attributionCompletionOutcome(false,false)).toBe('stale');
    expect(attributionCompletionOutcome(true,true)).toBe('delivered');
    expect(attributionCompletionOutcome(true,false)).toBe('failed');
  });
});
